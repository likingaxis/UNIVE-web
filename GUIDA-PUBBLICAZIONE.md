# Pubblicare gli appunti

## Procedura abituale

1. Modifica e salva gli appunti in Obsidian come sempre.
2. Fai doppio clic su **pubblica.cmd**, nella cartella `UNIVE-web-demo` accanto alla cartella `quartz`.
3. Attendi il messaggio di avvio e l'esito verde su [GitHub Actions](https://github.com/likingaxis/UNIVE-web/actions). Il sito si aggiorna dopo il deployment.

Il comando genera e controlla l'intero sito prima di inviare le modifiche. Se un controllo fallisce, mostra l'errore e interrompe la procedura. Le cartelle devono restare affiancate e Git deve essere autenticato con il tuo account. Se Git segnala nuovi commit sul remoto, sincronizza quella repository con il tuo normale flusso Git e riprova; il comando non forza mai il push.

## Scegliere una nuova nota

La homepage segue `content/index.md` del vault: puoi modificare lì presentazione, GIF e indici, poi avviare `pubblica.cmd`. I collegamenti agli indici dei corsi e degli anni vengono adattati ai percorsi del sito. Le esclusioni di Tesi e Magistrale valgono anche per i collegamenti e gli allegati della homepage.

In Obsidian aggiungi la proprietà **publish** di tipo **Checkbox** e spuntala. In modalità sorgente corrisponde a:

```yaml
---
publish: true
---
```

Se esiste già un blocco di proprietà, aggiungi la riga dentro quel blocco. Le note selezionate nella classificazione non hanno bisogno di questa proprietà per i normali aggiornamenti. Una nuova versione LONG non viene pubblicata solo perché si trova nella stessa cartella: devi sceglierla esplicitamente.

Sono ammesse nuove note nelle cartelle della Triennale; Tesi, Magistrale, PROGETTI personali, DRAFT, GPT PREMIUMS e configurazioni del vault restano escluse indipendentemente dalla proprietà. Gli allegati vengono inclusi soltanto se richiamati da una nota pubblicata; un'immagine dentro una cartella di bozze può essere riutilizzata singolarmente, mentre un allegato della tesi è sempre vietato.

## Ritirare una nota

Imposta `publish: false` e avvia `pubblica.cmd`. La pagina viene rimossa dal sito, dagli indici e dalla ricerca al deployment successivo. La nota originale rimane in Obsidian. Per una nota aggiunta con `publish: true`, togliere la proprietà la ritira; per una nota inclusa nella classificazione iniziale serve `publish: false`.

## Cosa viene salvato su GitHub

Il comando salva in un commit soltanto le modifiche alle note selezionate, alle proprietà di pubblicazione e agli allegati necessari al sito. Le altre modifiche del vault non entrano nel suo commit. Poi invia il branch `v4`: eventuali commit già creati da te su quel branch vengono inviati normalmente insieme ad esso. Nessun force push.

Nel repository del sito salva configurazione, selezione e strumenti; le copie degli appunti sono rigenerate durante il build. Non memorizza credenziali: usa l'autenticazione Git già configurata sul PC.

## Aggiornare dal browser

Se hai già salvato e inviato le note su GitHub con Obsidian Git, apri [Actions](https://github.com/likingaxis/UNIVE-web/actions), scegli **Pubblica appunti su GitHub Pages** e premi **Run workflow** sul branch `codex/site`. Il workflow recupera l'ultima versione degli originali dal branch `v4`.

## Cambiare tema

Da un terminale nella cartella del sito esegui `node tools/set-theme.mjs minimal` (sostituisci `minimal` con un tema Quartz compatibile), poi avvia `pubblica.cmd`. I temi Obsidian non sono tutti direttamente compatibili con Quartz.
