# تحقق مستقل بالحساب اليدوي (من غير core.js) لسيناريو 100 طن — بيقرأ test/scenario100.json ويطلع test/out/verify100.json
import json,sys,pathlib
d=pathlib.Path(__file__).parent;J=json.loads(pathlib.Path(sys.argv[1] if len(sys.argv)>1 else d/'scenario100.json').read_text());D=J['data']
num=lambda x:float(x) if x not in (None,'') else 0.0
P={}
for p in D['purchases']:
    net=num(p['gross'])-num(p['tare']);P[p['id']]=dict(net=net,unit=num(p['price'])*(1-num(p['disc'])/100),amount=net*(1-num(p['disc'])/100)*num(p['price']),trans=0.0,sup=p['supplierId'])
runTrans={}
for t in D['transports']:
    ids=t.get('purchaseIds') or []
    if ids:
        tot=sum(P[i]['net'] for i in ids)
        for i in ids:P[i]['trans']+=num(t['amount'])*P[i]['net']/tot
    elif t.get('runId'):runTrans[t['runId']]=runTrans.get(t['runId'],0)+num(t['amount'])
# مستلزمات: متوسط مرجح متحرك (الصنف كله)، بالترتيب: تاريخ ثم (وارد، تحويل، صرف)
ev=[]
for s in D['supplyIn']:
    for l in s['lines']:ev.append((s['date'],0,s['createdAt'],'in',l['itemId'],num(l['qty']),num(l['price']),None))
for s in D['transfers']:
    for l in s['lines']:ev.append((s['date'],1,s['createdAt'],'tf',l['itemId'],num(l['qty']),0,None))
for r in D['runs']:
    for l in r.get('supplies',[]):ev.append((r['date'],2,r['createdAt'],'out',l['itemId'],num(l['qty']),0,r['id']))
ev.sort(key=lambda e:(e[0],e[1],e[2]))
Q={};V={};issue={}
for e in ev:
    it=e[4];Q.setdefault(it,0);V.setdefault(it,0)
    if e[3]=='in':Q[it]+=e[5];V[it]+=e[5]*e[6]
    elif e[3]=='out':
        avg=V[it]/Q[it];c=e[5]*avg;Q[it]-=e[5];V[it]-=c;issue[e[7]]=issue.get(e[7],0)+c
# مبيعات الفرزة: صافي بعد المصروفات
FS={}
for s in D['sales']:
    if s['kind']!='farz':continue
    rate=num(s['rate']) if s['cur']=='USD' else 1
    revs=[(l['runId'],num(l['kg']),num(l['kg'])*num(l['price'])*rate) for l in s['lines']];rev=sum(x[2] for x in revs);exp=sum(num(e['amount']) for e in s.get('expenses',[]))
    for rid,kg,rv in revs:f=FS.setdefault(rid,[0,0]);f[0]+=kg;f[1]+=rv-exp*rv/rev
R={}
for r in D['runs']:
    raw=sum(num(i['kg']) for i in r['inputs'])
    rawCost=sum(num(i['kg'])*P[i['purchaseId']]['unit'] for i in r['inputs'])
    trans=sum(num(i['kg'])*P[i['purchaseId']]['trans']/P[i['purchaseId']]['net'] for i in r['inputs'])
    costs=sum(num(c['amount']) for c in r.get('costs',[]))
    shared=issue.get(r['id'],0)+costs+runTrans.get(r['id'],0)
    total=rawCost+trans+shared
    by=r.get('yieldBySupplier')
    cartons=sum(num(i.get('cartons')) for i in r['inputs']) if by else num(r['cartons'])
    farzS=sum(num(i.get('farzSacks')) for i in r['inputs']) if by else num(r['farzSacks'])
    fin=cartons*num(r['cartonKg']);farz=farzS*num(r['farzSackKg'])+(0 if by else num(r.get('farzExtraKg')))
    sk,sn=FS.get(r['id'],[0,0]);temp=r.get('farzTemp');temp=None if temp in (None,'') else float(temp)
    unsold=farz-sk
    if unsold<=0.005:credit=sn;status='final'
    elif temp is not None:credit=sn+unsold*temp;status='provisional'
    else:credit=sn;status='noprice'
    finCost=total-credit
    # لكل مورد
    sup={}
    for i in r['inputs']:
        p=P[i['purchaseId']];s=sup.setdefault(p['sup'],dict(kg=0,c=0,ct=0,fs=0));kg=num(i['kg'])
        s['kg']+=kg;s['c']+=kg*(p['unit']+p['trans']/p['net']);s['ct']+=num(i.get('cartons'));s['fs']+=num(i.get('farzSacks'))
    bys={}
    for k,s in sup.items():
        sh=s['kg']/raw;sf=s['ct']*num(r['cartonKg']) if by else fin*sh;sz=s['fs']*num(r['farzSackKg']) if by else farz*sh
        bys[k]=(s['c']+shared*sh-credit*sz/farz)/sf*1000
    R[r['id']]=dict(no=r['no'],raw=raw,fin=fin,farz=farz,waste=raw-fin-farz,rawCost=rawCost,trans=trans,shared=shared,total=total,credit=credit,status=status,finCost=finCost,perTon=finCost/fin*1000,finKg=finCost/fin,farzKg=(sn/sk if sk else 0),bySup=bys)
SL={}
for s in D['sales']:
    rate=num(s['rate']) if s['cur']=='USD' else 1;rev=0;cogs=0;kg=0
    for l in s['lines']:
        r=R[l['runId']]
        if s['kind']=='export':q=num(l['cartons'])*10;a=q/1000*num(l['price'])*rate;c=q*r['finKg']
        else:q=num(l['kg']);a=q*num(l['price'])*rate;c=q*r['farzKg']
        rev+=a;cogs+=c;kg+=q
    exp=sum(num(e['amount']) for e in s.get('expenses',[]))
    SL[s['id']]=dict(no=s['no'],kind=s['kind'],kg=kg,rev=rev,cogs=cogs,exp=exp,profit=rev-cogs-exp)
# الأرصدة (موجب = عليه)
BAL={p['id']:(num(p.get('open')) if p.get('openSide')!='c' else -num(p.get('open'))) for p in D['parties']}
for p in D['purchases']:BAL[p['supplierId']]-=P[p['id']]['amount']
for t in D['transports']:BAL[t['transporterId']]-=num(t['amount'])
for s in D['supplyIn']:BAL[s['supplierId']]-=sum(num(l['qty'])*num(l['price']) for l in s['lines'])
for r in D['runs']:
    for c in r.get('costs',[]):
        if c.get('partyId'):BAL[c['partyId']]-=num(c['amount'])
for s in D['sales']:
    BAL[s['customerId']]+=SL[s['id']]['rev']
    for e in s.get('expenses',[]):
        if e.get('partyId'):BAL[e['partyId']]-=num(e['amount'])
for y in D['payments']:
    a=num(y['amount'])*(num(y['rate']) if y.get('cur')=='USD' else 1);BAL[y['partyId']]+=(-a if y['dir']=='in' else a)
tot=dict(raw=sum(r['raw'] for r in R.values()),fin=sum(r['fin'] for r in R.values()),farz=sum(r['farz'] for r in R.values()),waste=sum(r['waste'] for r in R.values()),
 finCost=sum(r['finCost'] for r in R.values()),rev=sum(s['rev'] for s in SL.values()),cogs=sum(s['cogs'] for s in SL.values()),exp=sum(s['exp'] for s in SL.values()))
tot['perTon']=tot['finCost']/tot['fin']*1000;tot['profit']=tot['rev']-tot['cogs']-tot['exp']
out=dict(R=R,SL=SL,BAL=BAL,tot=tot);(d/'out').mkdir(exist_ok=True);pathlib.Path(sys.argv[2] if len(sys.argv)>2 else d/'out'/'verify100.json').write_text(json.dumps(out,ensure_ascii=False,indent=1))
for r in R.values():print('run',r['no'],r['status'],round(r['total'],2),round(r['perTon'],2),{k:round(v,2) for k,v in r['bySup'].items()})
print('tot',{k:round(v,2) for k,v in tot.items()})
