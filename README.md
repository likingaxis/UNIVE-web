# UNIVE — sito degli appunti

Sito Quartz 5 con tema **Primary**, basato su una selezione degli [appunti universitari UNIVE](https://github.com/likingaxis/UNIVE/tree/v4) di Luca Gugliotta.

**Sito:** https://likingaxis.github.io/UNIVE-web/

Questa repository contiene il motore del sito e una copia di due lezioni di Algoritmi con 13 allegati. La repository originale degli appunti rimane separata. Magistrale, Tesi, DRAFT e configurazioni personali sono escluse dalla generazione e non sono state importate.

## Aggiornamento e temi

Ogni push sul branch `codex/site` genera e pubblica il sito tramite GitHub Actions. Il workflow verifica l'assenza delle cartelle escluse anche dall'indice di ricerca.

Le modifiche nella repository originale degli appunti non vengono ancora sincronizzate automaticamente qui: questa è la prima selezione pubblicata. `demo-import.json` registra i file importati.

Il tema si cambia nel plugin `@quartz-themes/core` in `quartz.config.yaml`. Per installare un altro tema compatibile e aggiornare la configurazione:

```sh
node tools/set-theme.mjs minimal
```

Poi esegui commit e push dei file aggiornati; GitHub rigenera il sito. Il pulsante sole/luna cambia la modalità chiara/scura dello stesso tema.

## Anteprima locale

Richiede Node.js 22 o successivo.

```sh
npm ci
node node_modules/tsx/dist/cli.mjs quartz/plugins/loader/install-plugins.ts
npm run preview
```

Apri http://localhost:8088. Per altri dettagli vedi [DEMO.md](./DEMO.md).

## Progetto originale

Realizzato con [Quartz](https://quartz.jzhao.xyz/) e [Primary per Quartz](https://github.com/quartz-themes/primary). La licenza del motore è conservata in [LICENSE.txt](./LICENSE.txt).
