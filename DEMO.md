# Anteprima e temi

Il sito pubblicato usa Quartz 5 e il tema **Primary**, con modalità chiara e scura. La selezione attuale e il flusso di aggiornamento sono descritti in [README.md](README.md) e [GUIDA-PUBBLICAZIONE.md](GUIDA-PUBBLICAZIONE.md).

Gli originali rimangono nella cartella `quartz`, separata dal sito. Per rigenerare l'anteprima:

```sh
npm run export:notes
npm run preview
```

Apri http://localhost:8088. Il pulsante sole/luna cambia la modalità del tema corrente.

Per cambiare tema compatibile:

```sh
node tools/set-theme.mjs minimal
npm run preview
```

Usa `primary` per tornare a questo tema. Per aggiornare il sito online avvia `pubblica.cmd`. Lo script del tema installa il pacchetto e aggiorna la configurazione; non modifica gli appunti. Non tutti i temi Obsidian hanno un adattamento Quartz.
