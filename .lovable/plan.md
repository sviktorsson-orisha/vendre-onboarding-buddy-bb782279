## Byt namn på nycklarna i setup-guiden

I steg 2 i guiden (listan med nycklar och meddelandet om vilka som saknas) visas:
- "CLIENT_ID" i stället för "VENDRE_CLIENT_ID"
- "CLIENT_SECRET" i stället för "VENDRE_CLIENT_SECRET"

"VENDRE_BASE_URL" står kvar som den är. Det här ändrar bara texten du ser. De sparade nycklarna och kopplingen till butiken fungerar precis som förut.

### Tekniska detaljer
- `src/components/vendre/setup-wizard.tsx`: nycklarnas riktiga namn i `SECRET_NAMES` behålls, eftersom statusanropet returnerar `missing` med de namnen. Lägg till en visningskarta (`VENDRE_CLIENT_ID → CLIENT_ID`, `VENDRE_CLIENT_SECRET → CLIENT_SECRET`) och använd den både i listan och i felmeddelandet `step2.missing`.
- Inga ändringar på servern eller i sparade nycklar.
