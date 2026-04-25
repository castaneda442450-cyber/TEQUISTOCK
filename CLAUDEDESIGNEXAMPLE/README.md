# TequiStock — Design Reference

Esta carpeta contiene los archivos de diseño de referencia del sistema Cloud Design.

## Archivos

### Login.jsx
Mockup del login screen con:
- Gradiente diagonal: navy → darkGreen → terracota88
- SVG geométrico con opacidad 0.05
- Card central 420px max-width, shadow 0 32px 80px
- Logo + form con react-hook-form
- Spinner animado en loading

### Dashboard.jsx
Mockup del dashboard con:
- Sistema de filtros: periodo / mes / día
- 4 metric cards: inventario, compras, merma, críticos
- 3 rankings: productos, proveedores, top merma
- 2 charts: tendencia (Line) + gasto por categoría (Bar)
- Alerta de stock crítico

## Cloud Design Tokens

### Colores Light
```
terracota:    #BA3026   primario, acciones
terracotaDark:#8F221A   hover
gold:         #C2972E   acento
navy:         #0B4455   info, sidebar
green:        #106653   éxito, stock OK
bg:           #FAF8F5   fondo
surface:      #FFFFFF   tarjetas
border:       #E8E2DA   bordes
textMain:     #1C1714   texto principal
navBg:        #0B4455   sidebar
```

### Colores Dark
```
terracota:    #E8705A
bg:           #111318
surface:      #1C2028
navBg:        #0D1117
```

### Componentes
- Border-radius: Cards 10px, Modales 12px, Botones 8px
- Shadow card: 0 2px 8px rgba(0,0,0,0.06)
- Shadow hover: 0 6px 20px rgba(0,0,0,0.10)
- Shadow modal: 0 32px 80px rgba(0,0,0,0.28)
- Hover cards: translateY(-2px) + sombra elevada
- Focus inputs: border terracota + ring terracota/15

### Tipografía
- Familia: Plus Jakarta Sans
- Headings: font-weight 700-800, tracking-tight
- Labels: 11px, letter-spacing 0.4px, font-weight 600
- Body: 13px, Section: 14px
- Tabular: tabular-nums

### Categorías (badge colores)
```
Carnes:      #BA3026
Lácteos:     #C2972E
Verduras:    #106653
Bebidas:     #0B4455
Granos:      #7B5E2A
Condimentos: #5D4037
Mariscos:    #0288D1
```

### Tipos de merma
```
Vencimiento:  #BA3026
Mala calidad: #E67E22
Accidente:    #C2972E
Otro:         #78909C
```
