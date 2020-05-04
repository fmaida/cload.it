let file = undefined;
let file_selector = undefined;
let buffer = null;
let msx_tape = null;
let data = null;

/* Esegui quando la pagina viene caricata */
$(document).ready(function() {

    disablePlayAndStop();

    $("table").hide();

    file = undefined;

    msx_tape = new CassetteJS();

    /* Viene eseguito quando una cassetta viene caricata in memoria */
    msx_tape.on_load = function(length) {
        console.log("FILE READ (" + length.toString() + " Bytes)");
        if (typeof file_selector !== "undefined") {
            file_selector.innerText = "";
        }
        show_message("Operation in progress. Please wait...",
            "has-text-info");
        disablePlayAndStop();
    };

    /* Quando i blocchi nella cassetta vengono esaminati */
    msx_tape.on_block_analysis = function(index, total) {
        let testo = "Analysing block " + index.toString() + " of " + total.toString();
        show_message(testo, "has-text-info")
    };

    /* Quando la cassetta è stata caricata, analizzata e convertita */
    msx_tape.on_job_completed = function(file_list) {
        let temp = "";
        $("#game_list").empty();
        for(let element of file_list) {
            console.log(element.name);
            temp = "";
            temp += "<tr>";
            temp += "<td>" + element.name + "</td>";
            temp += "<td>" + element.type + "</td>";
            temp += "<td>" + element.data.length.toString() + "</td>";
            temp += "</tr>";
            $("#game_list").append(temp);
        }
        temp = "";
        if (typeof file !== "undefined") {
            temp += file.name;
        } else {
            temp += file_list[0].name.trim();
        }
        if (file_list.length > 0) {
            temp += " ";
            if (file_list[0].is_ascii()) {
                temp += "( RUN \"CAS:\" )";
            } else if (file_list[0].is_binary()) {
                temp += "( BLOAD \"CAS:\",R )";
            } else if (file_list[0].is_basic()) {
                temp += "( CLOAD )";
            }
        }
        show_message(temp);
        enablePlay();
    };

    /* Quando si verificano degli errori
       nell'analisi della cassetta */
    msx_tape.on_error = function(buffer) {
        console.log("FILE ERROR");
        let message = "Unable to load '" + file.name + "'. ";
        message += "This doesn't seems to be a valid MSX .cas file.";
        show_message(message);
        disablePlayAndStop();
    };

    /* Quando viene richiesta l'esportazione in formato WAV */
    msx_tape.on_audio_export = function(dati) {
        let file_name;
        if (typeof file === "undefined") {
            file_name = msx_tape.list[0].name;
        } else {
            file_name = file.name;
        }
        file_name.toLowerCase()
            .replace(".cas", "");
        file_name += ".wav";
        saveAs(dati, file_name);
    };

    $("#cas_selector").change(function(e) {

        disablePlayAndStop();

        file = document.getElementById("cas_selector").files[0];

        // Put the file name in the input field
        file_selector = $("#cas_name"); //.nextElementSibling;
        file_selector.html("");
        show_message("Loading '" + file.name + "'",
            "has-text-info");
        msx_tape.load_from_local_file(file)

    });

    $("#play").click(function(e) {
        e.preventDefault();
        play(buffer);
    });

    $("#stop").click(function(e) {
        e.preventDefault();
        stop();
    });

    $("#saveas").not(".is-disabled").click(function(e) {
        e.preventDefault();
        console.log("SAVE AS!");
        msx_tape.player.save();
    });

    $("#show_details").click(function(e) {
        e.preventDefault();
        $(".table").toggle();
        $(".dropdown").removeClass('is-active');
    });

    /* Quando l'utente clicca su di un link che contiene un file
       in formato .cas */
    $("a[href*=\".cas\"]").click(async function(e) {
        e.preventDefault();
        let link = e.target.href; //.replace(/(^\w+:|^)\/\//, "");
        console.log(link);
        //link = "examples/roadf.cas";
        response = await fetch(link);
        if (response.ok) {
            let buffer = await response.arrayBuffer();
            let gigetto = new Uint8Array(buffer);
            let result = msx_tape.load_from_remote_file(link, gigetto);
        }
        //console.log(result);
    });

    $(".dropdown .button").click(function (e){
        e.stopPropagation();
        var dropdown = $(this).parents('.dropdown');
        dropdown.toggleClass('is-active');
        /*dropdown.focusout(function(e) {
            $(this).removeClass('is-active');
        }); */
    });

    /*
    var riproduci = false;
    var msx = new MSX();


    // Cambia il testo nei pulsanti aggiungendo le icone
    $("button.esegui").html("<span class='fa fa-play'></span> Play");
    $("button.salva").html("<span class='fa fa-save'></span> Save");

    // Quando il pulsante "Ripoduci" viene cliccato...
    $("button.esegui").click(function() {
        if (riproduci === false) {
            // ...se non stava riproducendo, avvia l'audio
            $(this).html("<span class='fa fa-pause'></span> Pause");
            let percorso = $(this).attr("data-path")
            msx.play(percorso);
            riproduci = true;
        } else {
            // ...altrimenti mette in pausa la riproduzione
            // (non riesco a trovare un metodo "stop")
            $(this).html("<span class='fa fa-play'></span> Play");
            msx.audio.pause();
            riproduci = false;
        }

    }); */

    // Quando il pulsante "Salva" viene cliccato...
    /* $("button.salva").click(function() {
        var name = ""
        var blob = new Blob([dataURItoBlob(msx.wave.dataURI)]); // [window.btoa(msx.wave.dataURI)]);
        name = "output";
        if (msx.name !== undefined) {            
            if (msx.name.trim() != "") {
                name = msx.name.trim();
            }
        }
        saveAs(blob, name + ".wav");
    }); */

});

function disablePlayAndStop() {
    $("#play").attr("disabled", "disabled");
    $("#stop").attr("disabled", "disabled");
    $("#saveas").attr("disabled", "disabled");
}

function enablePlay() {
    $("#play").removeAttr("disabled");
    $("#stop").attr("disabled", "disabled");
    $("#saveas").removeAttr("disabled");
}

function enableStop() {
    $("#play").attr("disabled", "disabled");
    $("#stop").removeAttr("disabled");
    $("#saveas").removeAttr("disabled");
}

function play(file) {
   console.log("PLAY!");
   msx_tape.player.play();
   enableStop();
}

function stop()
{
    console.log("STOP!");
    msx_tape.player.stop();
    enablePlay();
}

function show_message(p_text="", p_class="")
{
    // GIGETTO
    let message = $("#cas_name");
    message.hide();
    message.removeClass("has-text-danger");
    message.removeClass("has-text-info");
    if (p_class !== "") {
        message.addClass(p_class);
    }
    message.html(p_text);
    message.show(0);
}

