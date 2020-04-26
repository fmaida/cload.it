---
date: 2020-04-26
---

Il pulsante dropdown di Bulma mi sta facendo diventare un po matto. 
Il problema grosso è che sono costretto ad utilizzare del codice
jQuery per visualizzare e nascondere il menù a tendina quando clicco
sul pulsante dropdown utilizzando questo codice:

```javascript
$(".dropdown .button").click(function (e){
    e.stopPropagation();
    var dropdown = $(this).parents('.dropdown');
    dropdown.toggleClass('is-active');
    dropdown.focusout(function(e) {
        $(this).removeClass('is-active');
    });
});
```

Il grosso problema è che quando tento di cliccare su un elemento nel menù
a tendina, prima che venga eseguito l'evento click viene eseguito 
l'evente `focusout` definito in precedenza, e cioè questo:

```javascript
dropdown.focusout(function(e) {
    $(this).removeClass('is-active');
});
```

che chiude il menù a tendina ed impedisce di fatto che l'evento click sul 
singolo elemento nel menù a tendina si propaghi.
Al momento per evitare il problema mi sono limitato a commentare l'evento
focusout quando clicco sulla tendina, con il risultato che posso aprire e 
chiudere il menù a tendina cliccando sul pulsante, MA non posso più chiudere 
automaticamente la tendina quando clicco fuori dal componente:

```javascript

$(".dropdown .button").click(function (e){
    e.stopPropagation();
    var dropdown = $(this).parents('.dropdown');
    dropdown.toggleClass('is-active');
    /* dropdown.focusout(function(e) {
        $(this).removeClass('is-active');
    }); */
});
```

In questo modo posso gestire il `click` sugli elementi nel menù a tendina, 
ed una volta eseguite le operazioni poi sono costretto a chiudere manualmente 
il menù ad esempio così:

```javascript 
$("#show_details").click(function(e) {
    e.preventDefault();
    $(".table").toggle();
    // Ora chiudo manualmente il menù a tendina (che era ancora aperto)
    $(".dropdown").removeClass('is-active');
});
```