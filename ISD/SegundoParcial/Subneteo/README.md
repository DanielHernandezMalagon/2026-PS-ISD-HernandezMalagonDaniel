# Calculadora de Subneteo IPv4

Página web para practicar subneteo de redes IPv4.

## Funciones
- **Decimal → Binario**: convierte un octeto o una IP completa y muestra el método de restas (128, 64, 32…).
- **FLSM**: divide una red en subredes del mismo tamaño, por número de subredes o por hosts por subred.
- **VLSM**: asigna a cada área el bloque más chico que le alcanza (ordenando de mayor a menor).
- **¿A qué red pertenece?**: obtiene red, primer y último host y broadcast de una IP (IP AND máscara).
- Botones con los ejercicios de la hoja (1, 2 y 3).

## Estructura
```
index.html        Página
css/styles.css    Estilos
js/subneteo.js    Lógica del subneteo (librería, sin HTML)
js/app.js         Interfaz: lee los formularios y pinta los resultados
```

## Cómo usar
Abrir `index.html` en el navegador o entrar a la página publicada en GitHub Pages.
`index.html#ejercicio=2` abre directamente el ejercicio 2.
