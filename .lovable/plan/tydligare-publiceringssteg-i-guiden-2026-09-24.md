## Tydligare publiceringssteg i guiden

Steg 3 ("Publicera och välj ett enklare domännamn") får en numrerad lista som visar exakt vad man ska göra:

1. Klicka på knappen **Publish** uppe till höger i Lovable.
2. Behåll den föreslagna adressen (t.ex. `mitt-namn.lovable.app`) eller ändra den till något du föredrar.
3. Klicka på **Publish changes** så att sidan faktiskt publiceras. Utan det här klicket är ingenting publicerat.
4. Kopiera adressen du valde och klistra in den i fältet nedan. Klicka sedan på **Använd adressen**.

Under listan står en kort rad om att det måste vara exakt den publicerade adressen som fylls i, eftersom den används i CORS-steget efteråt. Den nuvarande löptexten ersätts av listan. Texten finns på både svenska och engelska.

### Tekniska detaljer
- `src/lib/i18n.tsx`: nya nycklar `step3.how1`–`step3.how4` och `step3.note` (sv + en). `step3.body1a/b/c` och `step3.body2` används inte längre och tas bort.
- `src/components/vendre/setup-wizard.tsx`: i steg 3 ersätts de två `<p>` med en `<ol className="list-decimal space-y-1 pl-5">` på samma sätt som i steg 4, plus en `<p>` för noten. Knappnamnen visas i fetstil.
