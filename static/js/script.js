let file = undefined;
let file_selector = undefined;
let buffer = null;
let msx_tape = null;
let data = null;

// Esegui quando la pagina viene caricata
$(document).ready(function() {

    disablePlayAndStop();

    file = undefined;

    msx_tape = new CassetteJS();
    msx_tape.on_load = function(length) {
        console.log("FILE READ (" + length.toString() + " Bytes)");
        if (typeof file_selector !== "undefined") {
            file_selector.innerText = "";
        }
        show_message("Operation in progress. Please wait...",
            "text-info");
        disablePlayAndStop();
    };
    msx_tape.on_block_analysis = function(index, total) {
        show_message("Analysing block " + index.toString() + " of " + total.toString(),
            "text-info")
    };
    msx_tape.on_job_completed = function(file_list) {
        let temp = "";
        if (typeof file !== "undefined") {
            temp += file.name;
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
        if (typeof file_selector !== "undefined") {
            file_selector.innerText = temp;
        }
        show_message();
        enablePlay();
    };
    msx_tape.on_error = function(buffer) {
        console.log("FILE ERROR");
        let message = "Unable to load '" + file.name + "'. ";
        message += "This doesn't seems to be a valid MSX .cas file.";
        show_message(message);
        disablePlayAndStop();
    };
    msx_tape.on_audio_export = function(dati) {
        let file_name = file.name
            .toLowerCase()
            .replace(".cas", "");
        file_name += ".wav";
        saveAs(dati, file_name);
    };

    $("#file_selector").change(function(e) {

        disablePlayAndStop();

        file = document.getElementById("file_selector").files[0];

        // Put the file name in the input field
        file_selector = e.target.nextElementSibling;
        file_selector.innerText = "";
        show_message("Loading '" + file.name + "'",
            "text-info");
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

    $("#saveas").click(function(e) {
        e.preventDefault();
        console.log("SAVE AS!");
        msx_tape.player.save();
    });

    $(".tape").click(async function(e) {
        e.preventDefault();
        let link = e.target.href.replace(/(^\w+:|^)\/\//, "");
        //console.log(link);
        link = "examples/roadf.cas";
        response = await fetch(link);
        if (response.ok) {
            let buffer = await response.arrayBuffer();
            let gigetto = new Uint8Array(buffer);
            let result = msx_tape.load_from_remote_file(link, gigetto);
        }
        //console.log(result);
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
    $("#play").prop("disabled", true);
    $("#stop").prop("disabled", true);
    $("#saveas").prop("disabled", true);
}

function enablePlay() {
    $("#play").removeAttr("disabled");
    $("#stop").prop("disabled", true);
    $("#saveas").removeAttr("disabled");
}

function enableStop() {
    $("#play").prop("disabled", true);
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

function show_message(p_text="", p_class="text-danger")
{
    $("#message").hide();
    $("#message").removeClass("text-danger");
    $("#message").removeClass("text-info");
    $("#message").addClass(p_class);
    $("#message").html(p_text);
    $("#message").show(0);
}

