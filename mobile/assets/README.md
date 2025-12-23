# Assets do App

Coloque os arquivos de imagem nesta pasta:

## Arquivos necessários:

### `icon.png` (1024x1024)
Ícone do app. Deve ser quadrado, sem transparência, fundo sólido.

### `splash.png` (1284x2778)
Imagem da tela de splash/loading.

### `adaptive-icon.png` (1024x1024)
Ícone adaptativo para Android. Pode ter transparência.

### `favicon.png` (48x48)
Ícone para versão web.

### `notification-icon.png` (96x96)
Ícone para notificações push.

---

## Dicas:

1. Use um serviço como [Figma](https://figma.com) ou [Canva](https://canva.com) para criar os ícones

2. Gere automaticamente todos os tamanhos:
   - [App Icon Generator](https://appicon.co/)
   - [Expo Icon Builder](https://buildicon.netlify.app/)

3. Para o splash screen, considere usar apenas o logo centralizado com a cor de fundo definida no `app.json`

---

## Cores sugeridas:

- **Fundo:** #3B82F6 (azul primário)
- **Ícone:** Branco ou gradiente azul

---

## Placeholder temporário:

Para desenvolvimento, você pode criar imagens simples com texto:

```bash
# macOS com ImageMagick
convert -size 1024x1024 xc:#3B82F6 -gravity center -pointsize 200 -fill white -annotate 0 "AP" icon.png
```

Ou baixe ícones placeholder de:
- https://placeholder.com/
- https://picsum.photos/
