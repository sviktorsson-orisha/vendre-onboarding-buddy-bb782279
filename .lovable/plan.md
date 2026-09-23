# Avslutande avsnitt i setup-guiden: ta bort guiden

Längst ner i setup-guiden, efter steg 6, läggs ett litet avsnitt som förklarar att
guiden kan tas bort när butiken känns helt klar — och hur man gör det.

## Innehåll

- Rubrik: "Klar med butiken?"
- Text: när butiken är färdig kan hela uppstartsguiden och den översta
  informationsraden tas bort. Formuläret för butiks-URL, client id och client secret
  finns kvar och kan fortfarande öppnas.
- En kopierbar instruktion att skicka till chatten, t.ex.
  "Ta bort setup-guiden enligt .vendre/skills/remove-setup-guide.md".
- Kort notis om att ändringen går att ångra via projektets historik.

## Teknisk detalj

- `src/components/vendre/setup-wizard.tsx`: nytt avsnitt efter den sista
  `GuideStep` (utanför `<ol>`), i samma kort-/ramstil som övriga block, med den
  befintliga `CopyButton` för kommandotexten. Ingen ny logik, inget nytt steg i
  stegräkningen.
- `src/lib/i18n.tsx`: nya nycklar `remove.title`, `remove.body`, `remove.prompt`,
  `remove.hint` på svenska och engelska.
