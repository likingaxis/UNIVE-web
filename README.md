# UNIVE — sito degli appunti

[Apri il sito](https://likingaxis.github.io/UNIVE-web/) · [Appunti originali](https://github.com/likingaxis/UNIVE/tree/v4)

Sito Quartz 5 con tema Primary. La selezione iniziale comprende **222 note in 24 sezioni**, con sintesi, esercizi e laboratori. Information Retrieval usa le 13 lezioni principali, senza le versioni LONG in DRAFT. Tesi, Magistrale, materiali personali e bozze rimangono fuori dal sito.

## Pubblicare gli aggiornamenti

Modifica le note in Obsidian e avvia **pubblica.cmd** in questa cartella. Le note già selezionate sono aggiornate automaticamente; una nuova nota della Triennale può essere aggiunta con la proprietà booleana `publish: true`. Per ritirarne una, usa `publish: false`. La tesi rimane esclusa anche con `publish: true`.

Il comando controlla il sito, salva e invia soltanto le note selezionate e gli allegati necessari, poi avvia GitHub Pages. Modifiche estranee alla selezione restano locali. Attendi l'esito verde su [GitHub Actions](https://github.com/likingaxis/UNIVE-web/actions).

Vedi la [guida completa](GUIDA-PUBBLICAZIONE.md) e la [classificazione](publication/CLASSIFICAZIONE.md).

## Come funziona

`publication/selection.json` contiene la selezione approvata. `tools/export-notes.mjs` legge gli originali senza modificarli, riscrive i collegamenti nella copia web, genera gli indici e copia soltanto gli allegati referenziati, deduplicati tramite SHA-256. Le copie generate sono ignorate da Git. Sette allegati attualmente assenti sono segnalati nel testo delle pagine.

Ogni build in GitHub Actions recupera gli appunti dal branch `v4` di `likingaxis/UNIVE`, poi genera e controlla il sito. Il workflow parte con un push a `codex/site` oppure con **Run workflow**. Un push dei soli appunti richiede di avviare il workflow, oppure usare `pubblica.cmd`, che lo avvia per te.

## Anteprima e verifiche

Richiede Node.js 24 e le due repository affiancate: `quartz` (appunti) e `UNIVE-web-demo` (sito).

```sh
npm ci
npm run install-plugins
npm run export:notes
npm run preview
```

Anteprima su http://localhost:8088. Per verificare:

```sh
npm run test:publication
npm run build:site
node tools/verify-content.mjs
```

## Tema

Per cambiare tema compatibile con Quartz:

```sh
node tools/set-theme.mjs minimal
```

Poi avvia `pubblica.cmd`. Il pulsante sole/luna cambia la modalità chiara/scura del tema corrente. Una piccola modifica a `quartz/util/glob.ts` permette al build controllato di leggere le copie generate, intenzionalmente ignorate da Git.

Realizzato con [Quartz](https://quartz.jzhao.xyz/) e [Primary](https://github.com/quartz-themes/primary). Licenza del motore in [LICENSE.txt](LICENSE.txt).
