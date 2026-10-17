# Anteprima locale UNIVE

Quartz 5.0.0 con il tema **Primary** (`@quartz-themes/primary`), in modalità chiara e scura.

Questa cartella è separata dalla repository degli appunti. Contiene copie di due lezioni di Algoritmi, 13 allegati collegati e una pagina iniziale dimostrativa. I file originali non vengono modificati. `demo-import.json` elenca le fonti importate e i relativi hash.

Magistrale, Tesi, DRAFT e configurazioni Obsidian non sono stati importati. La configurazione contiene anche esclusioni per queste cartelle. Non è stata attivata alcuna pubblicazione online.

## Avvio

Da questa cartella, con Node.js 22 o successivo:

```sh
npm ci
npm run preview
```

Apri `http://localhost:8088`. Il pulsante sole/luna cambia la modalità chiara/scura dello stesso tema.

## Cambiare tema in futuro

Terminata l'anteprima corrente, usa il nome di un tema disponibile come pacchetto Quartz:

```sh
node tools/set-theme.mjs minimal
npm run preview
```

Per tornare a questo esempio, usa `primary` al posto di `minimal`. Lo script installa il pacchetto corrispondente e aggiorna la configurazione del sito; non modifica gli appunti. Se il pacchetto compatibile `@quartz-themes/<nome-tema>` è già installato, puoi cambiare direttamente `options.theme` del plugin `@quartz-themes/core` in `quartz.config.yaml`, poi rigenerare e riavviare con `npm run preview`. Non tutti i temi Obsidian dispongono di un adattamento Quartz.

Fonti: [Quartz](https://quartz.jzhao.xyz/), [Quartz Themes](https://github.com/saberzero1/quartz-themes), [Primary per Quartz](https://github.com/quartz-themes/primary).
