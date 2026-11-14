# يبني index.html من index.src.html: الـ CSS والخط Cairo جوه الصفحة نفسها، ويحدّث نسخة الكاش في sw.js
import base64,re,pathlib,hashlib
d=pathlib.Path(__file__).parent
css=(d/'style.css').read_text()
css=re.sub(r"url\(fonts/([\w.-]+)\)",lambda m:"url(data:font/woff2;base64,"+base64.b64encode((d/'fonts'/m.group(1)).read_bytes()).decode()+")",css)
html=(d/'index.src.html').read_text().replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
assert '<style>' in html;(d/'index.html').write_text(html)
ver=re.search(r"VER='([\d.]+)'",(d/'app.js').read_text()).group(1)
h=hashlib.sha1(b''.join((d/f).read_bytes() for f in ['index.html','core.js','db.js','report.js','app.js'])).hexdigest()[:8]
sw=(d/'sw.template.js').read_text().replace('__C__','strawberry-erp-'+ver+'-'+h);(d/'sw.js').write_text(sw)
print('index.html',len(html),'sw',ver,h)
