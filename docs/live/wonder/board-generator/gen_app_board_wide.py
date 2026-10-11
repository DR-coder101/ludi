"""Faithful SVG port of apps/mobile/src/components/board/BoardArt.tsx (+ BoardView Bevel,
PieceGlyph, MiniMap, jamaica.ts, theme/tokens.ts) from DR-coder101/ludi. Read-only port for
the TikTok overlay; geometry/colours copied verbatim. Usage: gen_app_board.py [tiles|notiles]"""
import math, re, sys
SRC='/workspace/ludi/apps/mobile/src/components/board/jamaica.ts'
JPATH=re.search(r'path: "([^"]+)"', open(SRC).read()).group(1)
PINS={'negril':(9.6,123.9),'montego':(217.7,23.8),'ocho':(579.1,57),'kingston':(720.5,254.3)}
MODE=(sys.argv[1] if len(sys.argv)>1 else 'tiles'); TILES=MODE=='tiles'; BIG=MODE=='big'
col=dict(bg='#0B0B0C',yard='#0E0E10',cream='#F6EFD9',green='#009B3A',greenBright='#19C45A',gold='#FED100',
 goldLight='#FFF3A0',redDeep='#9E0F1A',silver='#D9DCE1',hot='#FF3B7F',white='#FFFFFF',redText='#FF3340')
PIECE={'gold':dict(hi='#FFF3A0',mid='#FED100',lo='#A88400',rim='#FFF8D0'),
 'green':dict(hi='#7CF2A4',mid='#0FAE47',lo='#005C22',rim='#D8FFE6'),
 'red':dict(hi='#FF9AA0',mid='#E4202E',lo='#7A0710',rim='#FFE0E2'),
 'black':dict(hi='#7A7D84',mid='#26272B',lo='#050506',rim='#C9CDD4')}
ACC={'gold':col['gold'],'green':col['greenBright'],'red':col['redText'],'black':col['silver']}
PLACES={'yellow':dict(lines=['MONTEGO','BAY'],piece='gold',corner='TL',pin='montego'),
 'green':dict(lines=['OCHO','RIOS'],piece='green',corner='TR',pin='ocho'),
 'blue':dict(lines=['NEGRIL'],piece='black',corner='BL',pin='negril'),
 'red':dict(lines=['KINGSTON'],piece='red',corner='BR',pin='kingston')}
TURN=['red','green','yellow','blue']
NAMES={'red':'@Dave','green':'@Mike','yellow':'@Sarah','blue':'@John'}
ACTIVE=sys.argv[3] if len(sys.argv)>3 else 'red'
C=20
B=float(__import__('os').environ.get('ARM_B','27'))   # across-arm cell size (units); orig 20
L=(380-3*B)/16                                        # along-arm cell size; corners = 8L
YARD=8*L
def gpos(i):
    if i<=8: return i*L
    if i<=11: return 8*L+(i-8)*B
    return 8*L+3*B+(i-11)*L
P8,P11=gpos(8),gpos(11); CW=3*B
def cw(c): return gpos(c+1)-gpos(c)
MN=min(B,L)
TRACK=[(17,10),(16,10),(15,10),(14,10),(13,10),(12,10),(11,10),(10,11),(10,12),(10,13),(10,14),(10,15),(10,16),(10,17),(10,18),(9,18),(8,18),
(8,17),(8,16),(8,15),(8,14),(8,13),(8,12),(8,11),(7,10),(6,10),(5,10),(4,10),(3,10),(2,10),(1,10),(0,10),(0,9),(0,8),
(1,8),(2,8),(3,8),(4,8),(5,8),(6,8),(7,8),(8,7),(8,6),(8,5),(8,4),(8,3),(8,2),(8,1),(8,0),(9,0),(10,0),
(10,1),(10,2),(10,3),(10,4),(10,5),(10,6),(10,7),(11,8),(12,8),(13,8),(14,8),(15,8),(16,8),(17,8),(18,8),(18,9),(18,10)]
START={'red':0,'green':17,'yellow':34,'blue':51}
ENTRY={'red':66,'green':15,'yellow':32,'blue':49}
HOMECOL={'red':[(r,9) for r in range(17,10,-1)],'green':[(9,c) for c in range(17,10,-1)],
 'yellow':[(r,9) for r in range(1,8)],'blue':[(9,c) for c in range(1,8)]}
YTL={'red':(11,11),'green':(0,11),'yellow':(0,0),'blue':(11,0)}
STRIP_FILL={'gold':PIECE['gold']['mid'],'red':PIECE['red']['mid'],'green':PIECE['green']['mid'],'black':'#232428'}
STRIP_CHEV={'gold':col['bg'],'red':col['white'],'green':col['white'],'black':col['silver']}
CBAND={'gold':col['gold'],'red':PIECE['red']['mid'],'green':col['greenBright'],'black':col['silver']}
START_FILL={'gold':PIECE['gold']['mid'],'red':PIECE['red']['mid'],'green':PIECE['green']['mid'],'black':'#2a2b30'}
ROT={'right':0,'down':90,'left':180,'up':270}
# boardFixtures MID_POSITIONS (the app's own mid-game QA fixture)
MID={'red':[('t',1),('h',5),None,None],'green':[('t',20),('t',62),None,None],
 'yellow':[('t',37),('t',54),None,None],'blue':[('t',43),('t',43),('t',28),None]}
def dirb(a,b):
    if b[0]>a[0]: return 'down'
    if b[0]<a[0]: return 'up'
    return 'right' if b[1]>a[1] else 'left'
cx=lambda c:gpos(c[1])+cw(c[1])/2; cy=lambda c:gpos(c[0])+cw(c[0])/2
def outer(r,c):
    if r<8: return r
    if r>10: return 18-r
    if c<8: return c
    return 18-c
STRIPE=[col['green'],col['bg'],col['gold'],col['bg']]
def star(x,y,R):
    return ' '.join(f"{x+(R*0.45 if i%2 else R)*math.cos(-math.pi/2+i*math.pi/5):.2f},{y+(R*0.45 if i%2 else R)*math.sin(-math.pi/2+i*math.pi/5):.2f}" for i in range(10))
def isle(x,y,w,h,vb):
    vx,vy,vw,vh=vb;k=min(w/vw,h/vh)
    return f"translate({x+(w-vw*k)/2-vx*k} {y+(h-vh*k)/2-vy*k}) scale({k})"
o=[]
A=o.append
def piece(p,x,y,r,stack=None):
    P=PIECE[p]
    A(f'<ellipse cx="{x}" cy="{y+r*0.62}" rx="{r*1.02}" ry="{r*0.5}" fill="#000" opacity="0.55"/>')
    A(f'<circle cx="{x}" cy="{y+r*0.28}" r="{r}" fill="{P["lo"]}"/>')
    A(f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#pg-{p})" stroke="{P["rim"]}" stroke-opacity="0.9" stroke-width="{max(0.8,r*0.1)}"/>')
    A(f'<circle cx="{x}" cy="{y}" r="{r*0.62}" fill="none" stroke="{P["lo"]}" stroke-opacity="0.55" stroke-width="{r*0.12}"/>')
    A(f'<circle cx="{x}" cy="{y}" r="{r*0.52}" fill="none" stroke="#fff" stroke-opacity="0.28" stroke-width="{r*0.06}"/>')
    A(f'<ellipse cx="{x-r*0.18}" cy="{y-r*0.42}" rx="{r*0.55}" ry="{r*0.3}" fill="url(#spec)" opacity="0.8"/>')
    if stack and stack>1:
        A(f'<circle cx="{x+r*0.85}" cy="{y-r*0.85}" r="{r*0.52}" fill="{col["hot"]}" stroke="#fff" stroke-width="0.9"/>')
        A(f'<text x="{x+r*0.85}" y="{y-r*0.85+r*0.2}" font-family="Archivo Black" font-size="{r*0.62}" fill="#fff" text-anchor="middle">{stack}</text>')
S=388
A(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 {S} {S}" width="{S}" height="{S}">')
A('<defs>')
for k,P in PIECE.items():
    A(f'<radialGradient id="pg-{k}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="{P["hi"]}"/><stop offset="0.45" stop-color="{P["mid"]}"/><stop offset="1" stop-color="{P["lo"]}"/></radialGradient>')
A('<linearGradient id="spec" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>')
A('<pattern id="halftone-s" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r="0.75" fill="#fff"/></pattern>')
A('<linearGradient id="vid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4b50"/><stop offset="1" stop-color="#2a2b2f"/></linearGradient>')
A('<linearGradient id="bevel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2a2e"/><stop offset="0.6" stop-color="#050506"/><stop offset="1" stop-color="#1c1c1f"/></linearGradient>')
A('</defs>')
# Bevel (BoardView) — 4 units around the 380 art
A(f'<rect x="-4" y="-4" width="{S}" height="{S}" rx="10" fill="url(#bevel)"/>')
A(f'<rect x="-3.5" y="-3.5" width="{S-1}" height="{S-1}" rx="9.5" fill="none" stroke="{col["gold"]}" stroke-opacity="0.25" stroke-width="1"/>')
A(f'<rect x="4" y="-3" width="{S-16}" height="1" fill="#fff" opacity="0.12"/>')
A(f'<rect width="380" height="380" fill="{col["bg"]}"/>')
for (r,c) in TRACK:
    f=STRIPE[outer(r,c)%4]
    A(f'<rect x="{gpos(c)}" y="{gpos(r)}" width="{cw(c)}" height="{cw(r)}" fill="{f}"/>')
    if f!=col['bg']: A(f'<rect x="{gpos(c)}" y="{gpos(r)}" width="{cw(c)}" height="{cw(r)}" fill="url(#halftone-s)" opacity="0.1"/>')
for e in TURN:
    cells=HOMECOL[e]; p=PLACES[e]['piece']
    rows=[a for a,b in cells]; cols=[b for a,b in cells]
    x=gpos(min(cols));y=gpos(min(rows));w=gpos(max(cols)+1)-x;h=gpos(max(rows)+1)-y
    rot=ROT[dirb(cells[0],cells[1])]
    A(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{STRIP_FILL[p]}"/>')
    A(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#halftone-s)" opacity="0.13"/>')
    A(f'<rect x="{x+1.6}" y="{y+1.6}" width="{w-3.2}" height="{h-3.2}" fill="none" stroke="{col["bg"] if p=="gold" else col["cream"]}" stroke-opacity="0.55" stroke-width="1"/>')
    for c in cells:
        A(f'<path transform="translate({cx(c)} {cy(c)}) rotate({rot})" d="M-3.6 -5.4L2.4 0L-3.6 5.4" stroke="{STRIP_CHEV[p]}" stroke-opacity="0.55" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
d=''
for i in range(20):
    p=gpos(i)
    if 8<=i<=11: d+=f'M{p} 0V{P8}M{p} {P11}V380M0 {p}H{P8}M{P11} {p}H380'
    if i<=8 or i>=11: d+=f'M{P8} {p}H{P11}M{p} {P8}V{P11}'
A(f'<path d="{d}" stroke="{col["cream"]}" stroke-opacity="0.75" stroke-width="0.8" fill="none"/>')
# Centre flag (original 160..220 art, scaled to the wider centre)
A(f'<g transform="translate({P8} {P8}) scale({CW/60}) translate(-160 -160)">')
A(f'<polygon points="160,160 220,160 190,190" fill="{col["green"]}"/><polygon points="160,220 220,220 190,190" fill="{col["green"]}"/>')
A(f'<polygon points="160,160 160,220 190,190" fill="{col["bg"]}"/><polygon points="220,160 220,220 190,190" fill="{col["bg"]}"/>')
A(f'<path d="M160 160L220 220M220 160L160 220" stroke="{col["gold"]}" stroke-width="4.5"/>')
A('<rect x="160" y="160" width="60" height="60" fill="url(#halftone-s)" opacity="0.08"/>')
for e in TURN:
    last=HOMECOL[e][6]; b=CBAND[PLACES[e]['piece']]
    if last[0]==7: A(f'<rect x="160" y="160" width="60" height="2.6" fill="{b}"/>')
    elif last[0]==11: A(f'<rect x="160" y="217.4" width="60" height="2.6" fill="{b}"/>')
    elif last[1]==7: A(f'<rect x="160" y="160" width="2.6" height="60" fill="{b}"/>')
    else: A(f'<rect x="217.4" y="160" width="2.6" height="60" fill="{b}"/>')
A(f'<path d="M160 160H220V220H160Z" fill="none" stroke="{col["cream"]}" stroke-width="0.8"/>')
A(f'<g transform="{isle(164,180,52,20.5,[0,0,1000,394])}"><path d="{JPATH}" fill="none" stroke="{col["gold"]}" stroke-width="34" stroke-linejoin="round"/><path d="{JPATH}" fill="{col["bg"]}" stroke="{col["bg"]}" stroke-width="10" stroke-linejoin="round"/></g>')
A('</g>')
for e in TURN:
    p=PLACES[e]['piece']; s=TRACK[START[e]]; dark=p=='gold'
    A(f'<circle cx="{cx(s)}" cy="{cy(s)}" r="{MN*0.47}" fill="{START_FILL[p]}" stroke="{col["bg"] if dark else "#fff"}" stroke-opacity="0.8" stroke-width="0.9"/>')
    A(f'<polygon points="{star(cx(s),cy(s)+0.4,MN*0.33)}" fill="{col["bg"] if dark else "#fff"}"/>')
for e in TURN:
    a=ACC[PLACES[e]['piece']]; en=TRACK[ENTRY[e]]; rot=ROT[dirb(en,HOMECOL[e][0])]
    A(f'<g transform="translate({cx(en)} {cy(en)}) rotate({rot}) scale({MN*0.42/7})"><circle r="7" fill="{col["bg"]}" stroke="{a}" stroke-width="1"/><path d="M-3.4 0H3.2M0.6-2.8L3.4 0L0.6 2.8" stroke="{a}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>')
# Yards
for e in TURN:
    pl=PLACES[e]; p=pl['piece']; a=ACC[p]; r0,c0=YTL[e]; x=c0*C; y=r0*C; YK=YARD/160
    A(f'<g transform="translate({gpos(c0)} {gpos(r0)}) scale({YK}) translate({-x} {-y})">')
    YARD_=YARD; YARD=160
    ox,oy={'TL':(x,y),'TR':(x+YARD,y),'BL':(x,y+YARD),'BR':(x+YARD,y+YARD)}[pl['corner']]
    i_=pl['pin']; active=e==ACTIVE
    fs=19.5 if len(pl['lines'])>1 else (20 if len(pl['lines'][0])>6 else 24)
    mapY=y+33+(len(pl['lines'])-1)*(fs-1)+7
    ty0=33; mw=62
    if BIG:  # no video tile: use the freed right half for bigger name/map/slots
        two=len(pl['lines'])>1
        fs=30 if two else (31 if len(pl['lines'][0])>6 else 36)
        ty0=40 if two else 44
        mw=80 if two else 96
        mapY=y+ty0+(len(pl['lines'])-1)*(fs-1)+8
    A(f'<defs><radialGradient id="hg-{i_}" gradientUnits="userSpaceOnUse" cx="{ox}" cy="{oy}" r="190" fx="{ox}" fy="{oy}"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
      f'<mask id="hm-{i_}" x="{x}" y="{y}" width="{YARD}" height="{YARD}" maskUnits="userSpaceOnUse"><rect x="{x}" y="{y}" width="{YARD}" height="{YARD}" fill="url(#hg-{i_})"/></mask>'
      f'<pattern id="ht-{i_}" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.05" fill="{a}"/></pattern>'
      f'<clipPath id="yc-{i_}"><rect x="{x}" y="{y}" width="{YARD}" height="{YARD}"/></clipPath></defs>')
    A(f'<rect x="{x}" y="{y}" width="{YARD}" height="{YARD}" fill="{col["yard"]}"/>')
    for i in range(1,8):
        A(f'<line x1="{x+i*C}" y1="{y}" x2="{x+i*C}" y2="{y+YARD}" stroke="#fff" stroke-opacity="0.05" stroke-width="0.6"/><line x1="{x}" y1="{y+i*C}" x2="{x+YARD}" y2="{y+i*C}" stroke="#fff" stroke-opacity="0.05" stroke-width="0.6"/>')
    A(f'<rect x="{x}" y="{y}" width="{YARD}" height="{YARD}" fill="url(#ht-{i_})" mask="url(#hm-{i_})" opacity="{0.2 if p=="black" else 0.3}"/>')
    A(f'<g clip-path="url(#yc-{i_})">'+''.join(f'<circle cx="{ox}" cy="{oy}" r="{i*14}" fill="none" stroke="{a}" stroke-opacity="{0.16-i*0.02:.2f}" stroke-width="1"/>' for i in range(1,6))+'</g>')
    if active:
        A(f'<rect x="{x+5}" y="{y+5}" width="150" height="150" rx="9" fill="none" stroke="{a}" stroke-opacity="0.12" stroke-width="10"/><rect x="{x+5}" y="{y+5}" width="150" height="150" rx="9" fill="none" stroke="{a}" stroke-opacity="0.22" stroke-width="6"/>')
    A(f'<rect x="{x+5}" y="{y+5}" width="150" height="150" rx="9" fill="none" stroke="{a}" stroke-width="{2.6 if active else 1.6}"/>')
    A(f'<rect x="{x+8.5}" y="{y+8.5}" width="143" height="143" rx="6.5" fill="none" stroke="{a}" stroke-opacity="0.35" stroke-width="0.7" stroke-dasharray="1.5 2.5"/>')
    for i,ln in enumerate(pl['lines']):
        A(f'<text x="{x+14}" y="{y+ty0+i*(fs-1)}" font-family="Anton" font-size="{fs}" fill="{a}" letter-spacing="0.3">{ln}</text>')
    mh=mw*394.2/1000; px,py=PINS[i_]
    A(f'<g transform="{isle(x+14,mapY,mw,mh,[-40,-40,1080,474])}"><path d="{JPATH}" fill="#45464c" stroke="#45464c" stroke-width="6" stroke-linejoin="round"/><circle cx="{px}" cy="{py}" r="120" fill="{a}" opacity="0.25"/><circle cx="{px}" cy="{py}" r="62" fill="{a}" stroke="{col["yard"]}" stroke-width="22"/></g>')
    if TILES:
        tx,ty,w,h=x+90,y+13,57,70; mid=tx+w/2
        A(f'<defs><clipPath id="clip-{i_}"><rect x="{tx}" y="{ty}" width="{w}" height="{h}" rx="7"/></clipPath></defs>')
        A(f'<rect x="{tx}" y="{ty}" width="{w}" height="{h}" rx="7" fill="url(#vid)"/>')
        A(f'<g clip-path="url(#clip-{i_})" fill="#7b7d83"><circle cx="{mid}" cy="{ty+h*0.4}" r="{w*0.19}"/><ellipse cx="{mid}" cy="{ty+h*0.98}" rx="{w*0.4}" ry="{h*0.3}"/><rect x="{tx}" y="{ty+h-15}" width="{w}" height="15" fill="#000" opacity="0.55"/></g>')
        A(f'<rect x="{tx}" y="{ty}" width="{w}" height="{h}" rx="7" fill="none" stroke="{a}" stroke-width="{2.2 if active else 1.3}"/>')
        A(f'<text x="{tx+5}" y="{ty+h-4.5}" font-family="Inter" font-weight="700" font-size="7.6" fill="#fff">{NAMES[e]}</text>')
    toks=[i for i,pos in enumerate(MID[e]) if pos is None]
    for i in range(4):
        sx=c0*C+(26+i*36 if BIG else 29+i*34); sy=r0*C+(131 if BIG else 124); SR=15 if BIG else 12.5
        A(f'<circle cx="{sx}" cy="{sy}" r="{SR}" fill="#000" fill-opacity="0.45" stroke="{a}" stroke-opacity="0.55" stroke-width="1"/>')
        if i<len(toks): piece(p,sx,sy-1,12 if BIG else 9.6)
        else: A(f'<polygon points="{star(sx,sy,6.5 if BIG else 5)}" fill="{a}" opacity="0.35"/>')
    YARD=YARD_; A('</g>')
A(f'<path d="M{P8} 0V{P8}H0M{P11} 0V{P8}H380M{P8} 380V{P11}H0M{P11} 380V{P11}H380" stroke="%s" stroke-opacity="0.75" stroke-width="0.8" fill="none"/>'.replace('%s',col['cream']))
# Pieces on track (MID fixture), stacked same-colour → count badge
cells={}
for e in TURN:
    for pos in MID[e]:
        if pos is None: continue
        c=TRACK[pos[1]] if pos[0]=='t' else HOMECOL[e][pos[1]-1]
        cells.setdefault(c,{}).setdefault(e,0); cells[c][e]+=1
for c,byc in cells.items():
    tot=len(byc)
    for n,(e,cnt) in enumerate(byc.items()):
        dx=(n-(tot-1)/2)*0.36 if tot>1 else 0
        piece(PLACES[e]['piece'],cx(c)+dx*cw(c[1]),cy(c)-1,MN*0.47,cnt)
A('</svg>')
open(sys.argv[2] if len(sys.argv)>2 else '/workspace/ludi_design_scratch/app_board/app_board.svg','w').write('\n'.join(o))
