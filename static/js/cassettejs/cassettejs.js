var FastBase64 = {
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encLookup: [],
    Init: function () {
        for (var i = 0; i < 4096; i++) {
            this.encLookup[i] = this.chars[i >> 6] + this.chars[i & 0x3F];
        }
    },
    Encode: function (src) {
        var len = src.length;
        var dst = '';
        var i = 0;
        while (len > 2) {
            let n = (src[i] << 16) | (src[i + 1] << 8) | src[i + 2];
            dst += this.encLookup[n >> 12] + this.encLookup[n & 0xFFF];
            len -= 3;
            i += 3;
        }
        if (len > 0) {
            var n1 = (src[i] & 0xFC) >> 2;
            var n2 = (src[i] & 0x03) << 4;
            if (len > 1)
                n2 |= (src[++i] & 0xF0) >> 4;
            dst += this.chars[n1];
            dst += this.chars[n2];
            if (len == 2) {
                var n3 = (src[i++] & 0x0F) << 2;
                n3 |= (src[i] & 0xC0) >> 6;
                dst += this.chars[n3];
            }
            if (len == 1)
                dst += '=';
            dst += '=';
        }
        return dst;
    }
};
FastBase64.Init();
var RIFFWAVE = function (data = undefined) {
    this.data = [];
    this.wav = [];
    this.dataURI = '';
    this.header = {
        chunkId: [0x52, 0x49, 0x46, 0x46],
        chunkSize: 0,
        format: [0x57, 0x41, 0x56, 0x45],
        subChunk1Id: [0x66, 0x6d, 0x74, 0x20],
        subChunk1Size: 16,
        audioFormat: 1,
        numChannels: 1,
        sampleRate: 8000,
        byteRate: 0,
        blockAlign: 0,
        bitsPerSample: 8,
        subChunk2Id: [0x64, 0x61, 0x74, 0x61],
        subChunk2Size: 0
    };
    function u32ToArray(i) {
        return [i & 0xFF, (i >> 8) & 0xFF, (i >> 16) & 0xFF, (i >> 24) & 0xFF];
    }
    function u16ToArray(i) {
        return [i & 0xFF, (i >> 8) & 0xFF];
    }
    function split16bitArray(data) {
        var r = [];
        var j = 0;
        var len = data.length;
        for (var i = 0; i < len; i++) {
            r[j++] = data[i] & 0xFF;
            r[j++] = (data[i] >> 8) & 0xFF;
        }
        return r;
    }
    this.Make = function (data) {
        if (data instanceof Array)
            this.data = data;
        this.header.blockAlign = (this.header.numChannels * this.header.bitsPerSample) >> 3;
        this.header.byteRate = this.header.blockAlign * this.sampleRate;
        this.header.subChunk2Size = this.data.length * (this.header.bitsPerSample >> 3);
        this.header.chunkSize = 36 + this.header.subChunk2Size;
        this.wav = this.header.chunkId.concat(u32ToArray(this.header.chunkSize), this.header.format, this.header.subChunk1Id, u32ToArray(this.header.subChunk1Size), u16ToArray(this.header.audioFormat), u16ToArray(this.header.numChannels), u32ToArray(this.header.sampleRate), u32ToArray(this.header.byteRate), u16ToArray(this.header.blockAlign), u16ToArray(this.header.bitsPerSample), this.header.subChunk2Id, u32ToArray(this.header.subChunk2Size), (this.header.bitsPerSample == 16) ? split16bitArray(this.data) : this.data);
        this.dataURI = 'data:audio/wav;base64,' + FastBase64.Encode(this.wav);
    };
    if (data instanceof Array)
        this.Make(data);
};
class MSXTapeParameters {
    constructor() {
        this.blocco_intestazione = new Uint8Array([0x1F, 0xA6, 0xDE, 0xBA,
            0xCC, 0x13, 0x7D, 0x74]);
        this.blocco_file_ascii = new Uint8Array([0xEA, 0xEA, 0xEA, 0xEA, 0xEA,
            0xEA, 0xEA, 0xEA, 0xEA, 0xEA]);
        this.blocco_file_basic = new Uint8Array([0xD3, 0xD3, 0xD3, 0xD3, 0xD3,
            0xD3, 0xD3, 0xD3, 0xD3, 0xD3]);
        this.blocco_file_binario = new Uint8Array([0xD0, 0xD0, 0xD0, 0xD0, 0xD0,
            0xD0, 0xD0, 0xD0, 0xD0, 0xD0]);
    }
}
class DataBuffer {
    constructor(p_data) {
        this.load(p_data);
    }
    load(p_data) {
        this.data = p_data;
    }
    contains(p_pattern, p_begin_at = 0) {
        let i = 0;
        let same = true;
        while ((i < p_pattern.length) && (same)) {
            if (this.data[p_begin_at + i] !== p_pattern[i]) {
                same = false;
            }
            i++;
        }
        return same;
    }
    seek(p_pattern, p_begin_at = 0) {
        let i = p_begin_at;
        let position = -1;
        let found = false;
        while ((i < this.data.length) && (!found)) {
            if (this.contains(p_pattern, i)) {
                position = i;
                found = true;
            }
            i++;
        }
        return position;
    }
    slice(p_inizio = 0, p_fine = this.data.length) {
        let output;
        output = new Array(p_fine - p_inizio);
        if (typeof (this.data.slice) !== "undefined") {
            output = this.data.slice(p_inizio, p_fine);
        }
        else {
            for (let i = p_inizio; i < p_fine; i++) {
                output[i - p_inizio] = this.data[i];
            }
        }
        return output;
    }
    length() {
        return this.data.length;
    }
}
class DataBlock {
    constructor(p_data = undefined) {
        this.system = "generic";
        if (typeof p_data !== "undefined")
            this.import(p_data);
    }
    set_name(p_name) {
        this.name = p_name;
    }
    get_name() {
        return this.name;
    }
    set_type(p_type) {
        this.type = p_type;
    }
    get_type() {
        return this.type;
    }
    is_custom() {
        return (this.type == "custom");
    }
    import(p_data) {
        this.data = p_data;
    }
    append(p_block) {
        let data = new Array(this.data.length + p_block.data.length);
        let offset = 0;
        for (let i = 0; i < this.data.length; i++) {
            data[offset + i] = this.data[i];
        }
        offset += this.data.length;
        for (let i = 0; i < p_block.data.length; i++) {
            data[offset + i] = p_block.data[i];
        }
        this.data = data;
        this.set_data_end(p_block.get_data_end());
    }
    contains(p_pattern) {
        let match = true;
        for (let i = 0; i < p_pattern.length; i++) {
            if (this.data[i] !== p_pattern[i]) {
                match = false;
                i = p_pattern.length;
            }
        }
        return match;
    }
    get_data() {
        return this.data;
    }
    set_data_begin(p_value) {
        this.data_begin = p_value;
    }
    get_data_begin() {
        return this.data_begin;
    }
    set_data_end(p_value) {
        this.data_end = p_value;
    }
    get_data_end() {
        return this.data_end;
    }
    get_data_length() {
        let length = this.data_end - this.data_begin;
        if (length < 0) {
            length = -1;
        }
        return length;
    }
}
function data_uri_to_blob(dataURI) {
    let byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);
    let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    let ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], { type: mimeString });
}
function export_as_file(p_self) {
    return new Blob([data_uri_to_blob(p_self.wave.dataURI)]);
}
class BlockTypes {
}
BlockTypes.header_block = [0x1F, 0xA6, 0xDE, 0xBA, 0xCC, 0x13, 0x7D, 0x74];
BlockTypes.ascii_file_block = [0xEA, 0xEA, 0xEA, 0xEA, 0xEA, 0xEA,
    0xEA, 0xEA, 0xEA, 0xEA];
BlockTypes.basic_file_block = [0xD3, 0xD3, 0xD3, 0xD3, 0xD3,
    0xD3, 0xD3, 0xD3, 0xD3, 0xD3];
BlockTypes.binary_file_block = [0xD0, 0xD0, 0xD0, 0xD0, 0xD0,
    0xD0, 0xD0, 0xD0, 0xD0, 0xD0];
class MSXBuffer extends DataBuffer {
    extract_block(p_inizio) {
        let block1;
        let block2;
        block1 = this.seek_single_block(p_inizio);
        if (block1 !== null) {
            if (!block1.is_custom()) {
                block2 = this.seek_single_block(block1.get_data_end());
                if (block2 !== null) {
                    block1.append(block2);
                }
            }
        }
        return block1;
    }
    seek_single_block(p_inizio) {
        let pos1;
        let pos2;
        let block = null;
        pos1 = this.seek(BlockTypes.header_block, p_inizio);
        if (pos1 >= 0) {
            pos1 += BlockTypes.header_block.length;
            pos2 = this.seek(BlockTypes.header_block, pos1);
            if (pos2 < 0) {
                pos2 = this.length();
            }
            block = new MSXBlock(this.slice(pos1, pos2));
            block.set_data_begin(pos1);
            block.set_data_end(pos2);
        }
        else {
        }
        return block;
    }
}
class MSXBlock extends DataBlock {
    constructor(p_data = undefined) {
        super(p_data);
        this.system = "msx";
    }
    set_name(p_name) {
        if (p_name.length > 6) {
            p_name = p_name.substring(0, 6);
        }
        this.name = p_name;
    }
    get_name() {
        return this.name;
    }
    set_type(p_type) {
        this.type = p_type;
    }
    get_type() {
        return this.type;
    }
    is_custom() {
        return (this.type == "custom");
    }
    import(p_data) {
        this.data = p_data;
        this.type = this.analyze_block_type();
        if (!this.is_custom()) {
            this.set_name(this.analyze_block_name());
            let temp = Array(p_data.length - 16);
            for (let i = 16; i < p_data.length; i++) {
                temp[i - 16] = p_data[i];
            }
            this.data = temp;
        }
    }
    analyze_block_type() {
        var block_type = "custom";
        if (this.contains(BlockTypes.ascii_file_block)) {
            block_type = "ascii";
        }
        else if (this.contains(BlockTypes.basic_file_block)) {
            block_type = "basic";
        }
        else if (this.contains(BlockTypes.binary_file_block)) {
            block_type = "binary";
        }
        return block_type;
    }
    analyze_block_name() {
        var block_name = "";
        var begin = 10;
        for (let i = begin; i < begin + 6; i++) {
            block_name += String.fromCharCode(this.data[i]);
        }
        return block_name;
    }
    is_ascii() {
        return this.type === "ascii";
    }
    is_basic() {
        return this.type === "basic";
    }
    is_binary() {
        return this.type === "binary";
    }
}
class Cassette {
    constructor() {
    }
    load(p_buffer, callback_function = undefined) {
        let buffer = new DataBuffer(p_buffer);
        return this.analyse(buffer);
    }
    analyse(buffer) {
        return [];
    }
}
class MSX extends Cassette {
    load(p_buffer, callback_function = undefined) {
        let buffer;
        let list;
        buffer = new MSXBuffer(p_buffer);
        list = this.analyse(buffer);
        if (list.length > 0) {
            this.export_as_wav(callback_function);
        }
        return list;
    }
    analyse(buffer) {
        let pos = 0;
        let block = undefined;
        let found = false;
        let list = [];
        while (block !== null) {
            if (pos !== 0) {
            }
            block = buffer.extract_block(pos);
            if (block !== null) {
                found = true;
                list.push(block);
                pos = block.get_data_end();
            }
        }
        return list;
    }
    export_as_wav(callback_function = undefined) {
    }
}
class MSXWAVExporter {
    constructor() {
        this.on_block_conversion = undefined;
        this.frequenza = 44100;
        this.bitrate = 2205;
        this.ampiezza = 0.85;
        this.sincronismo_lungo = 2500;
        this.sincronismo_corto = 1500;
        this.silenzio_lungo = 2000;
        this.silenzio_corto = 1250;
        this.recalculate_waveforms();
        this.buffer = [];
    }
    recalculate_waveforms() {
        this.campionamenti = this.frequenza / this.bitrate;
        let passo = Math.floor(this.campionamenti / 4);
        let max = Math.floor(255 * this.ampiezza);
        let min = 255 - max;
        let i;
        this.wave_bit_0 = new Array();
        for (i = 0; i < passo * 2; i++)
            this.wave_bit_0.push(min);
        for (i = 0; i < passo * 2; i++)
            this.wave_bit_0.push(max);
        this.wave_bit_1 = new Array();
        for (i = 0; i < passo; i++)
            this.wave_bit_1.push(min);
        for (i = 0; i < passo; i++)
            this.wave_bit_1.push(max);
        for (i = 0; i < passo; i++)
            this.wave_bit_1.push(min);
        for (i = 0; i < passo; i++)
            this.wave_bit_1.push(max);
        this.wave_silenzio = new Array();
        for (i = 0; i < passo * 4; i++)
            this.wave_silenzio.push(128);
        this.wave_sincronismo_lungo = new Array();
        this.wave_sincronismo_corto = new Array();
        i = 0;
        while (i < this.bitrate * this.campionamenti * this.sincronismo_lungo / 1000) {
            this.wave_sincronismo_lungo.push(...this.wave_bit_1);
            i += this.wave_bit_1.length;
        }
        i = 0;
        while (i < this.bitrate * this.campionamenti * this.sincronismo_corto / 1000) {
            this.wave_sincronismo_corto.push(...this.wave_bit_1);
            i += this.wave_bit_1.length;
        }
        this.wave_silenzio_lungo = new Array();
        this.wave_silenzio_corto = new Array();
        i = 0;
        while (i < this.bitrate * this.campionamenti * this.silenzio_lungo / 1000) {
            this.wave_silenzio_lungo.push(...this.wave_silenzio);
            i += this.wave_silenzio.length;
        }
        i = 0;
        while (i < this.bitrate * this.campionamenti * this.silenzio_corto / 1000) {
            this.wave_silenzio_corto.push(...this.wave_silenzio);
            i += this.wave_silenzio.length;
        }
    }
    inserisci_bit(p_bit) {
        if (p_bit === 0) {
            this.buffer.push(...this.wave_bit_0);
        }
        else if (p_bit === 1) {
            this.buffer.push(...this.wave_bit_1);
        }
        else {
            this.buffer.push(...this.wave_silenzio);
        }
    }
    inserisci_byte(p_byte) {
        this.inserisci_bit(0);
        for (let i = 0; i < 8; i++) {
            if ((p_byte & 1) == 0) {
                this.inserisci_bit(0);
            }
            else {
                this.inserisci_bit(1);
            }
            p_byte = p_byte >> 1;
        }
        this.inserisci_bit(1);
        this.inserisci_bit(1);
    }
    inserisci_array(p_array) {
        var i = 0;
        for (i = 0; i < p_array.length; i++) {
            this.inserisci_byte(p_array[i]);
        }
    }
    inserisci_stringa(p_stringa) {
        var i = 0;
        for (i = 0; i < p_stringa.length; i++) {
            this.inserisci_byte(p_stringa.charCodeAt(i));
        }
    }
    inserisci_sincronismo(p_durata) {
        if (p_durata == this.sincronismo_lungo) {
            this.buffer.push(...this.wave_sincronismo_lungo);
        }
        else if (p_durata == this.sincronismo_corto) {
            this.buffer.push(...this.wave_sincronismo_corto);
        }
        else {
            let i = 0;
            while (i < this.bitrate * this.campionamenti * p_durata / 1000) {
                this.inserisci_bit(1);
                i += this.wave_bit_1.length;
            }
        }
    }
    add_silence(p_durata) {
        if (p_durata == this.silenzio_lungo) {
            this.buffer.push(...this.wave_silenzio_lungo);
        }
        else if (p_durata == this.silenzio_corto) {
            this.buffer.push(...this.wave_silenzio_corto);
        }
        else {
            let i = 0;
            while (i < this.bitrate * this.campionamenti * p_durata / 1000) {
                this.inserisci_bit(-1);
                i += this.wave_silenzio.length;
            }
        }
    }
    add_long_silence() {
        this.buffer.push(...this.wave_silenzio_lungo);
    }
    add_short_silence() {
        this.buffer.push(...this.wave_silenzio_corto);
    }
    render_block(p_blocco) {
        this.inserisci_sincronismo(this.sincronismo_lungo);
        if (p_blocco.type == "ascii") {
            this.inserisci_array(BlockTypes.ascii_file_block);
        }
        else if (p_blocco.type == "basic") {
            this.inserisci_array(BlockTypes.basic_file_block);
        }
        else if (p_blocco.type == "binary") {
            this.inserisci_array(BlockTypes.binary_file_block);
        }
        if (p_blocco.type != "custom") {
            this.inserisci_stringa(p_blocco.name);
            this.add_short_silence();
            this.inserisci_sincronismo(this.sincronismo_corto);
        }
        this.inserisci_array(p_blocco.data);
        return true;
    }
    export_as_wav(p_list) {
        let i = 0;
        this.add_silence(750);
        for (let block of p_list) {
            i += 1;
            if (typeof this.on_block_conversion !== "undefined") {
                this.on_block_conversion(i, p_list.length);
            }
            this.render_block(block);
            if (i < p_list.length) {
                this.add_long_silence();
            }
        }
        this.add_silence(1000);
        return this.create_wav();
    }
    create_wav() {
        let wav_exporter = new RIFFWAVE();
        wav_exporter.header.sampleRate = this.frequenza;
        wav_exporter.header.numChannels = 1;
        wav_exporter.Make(this.buffer);
        return wav_exporter;
    }
}
class WAVExporter {
    constructor() {
        this.msx = new MSXWAVExporter();
    }
    export(p_list) {
        this.buffer = this.msx.export_as_wav(p_list);
    }
}
class Player {
    constructor(p_list, callback = undefined) {
        this.on_job_completed = callback;
        this.audio = new Audio();
        this.exporter = new WAVExporter();
        this.exporter.export(p_list);
        this.audio.src = this.exporter.buffer.dataURI;
        if (typeof this.on_job_completed !== "undefined") {
            this.on_job_completed(p_list);
        }
    }
    play() {
        this.audio.play();
    }
    pause() {
        this.audio.pause();
    }
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
    }
    save() {
        let data = this.exporter.buffer.dataURI;
        if (typeof data !== "undefined") {
            if (typeof this.on_audio_export !== "undefined") {
                this.on_audio_export(data);
            }
            else {
                return false;
            }
        }
        else {
            if (typeof this.on_error !== "undefined") {
                this.on_error("File I/O Error");
            }
            return false;
        }
        return true;
    }
}
class CassetteJS {
    constructor() {
        this.on_load = undefined;
        this.on_block_analysis = undefined;
        this.on_job_completed = undefined;
        this.on_error = undefined;
        this.on_audio_export = undefined;
        this.list = [];
        this.initialize();
    }
    initialize() {
        this.name = "";
        this.parameters = new MSXTapeParameters();
        this.msx = new MSX();
    }
    load_from_local_file(p_file) {
        let request = new FileReader();
        let self = this;
        request.onloadend = function (e) {
            if (e.target.readyState == FileReader.DONE) {
                if (typeof self.on_load !== "undefined") {
                    self.on_load(request.result.byteLength);
                }
                self.name = p_file.name
                    .toLowerCase()
                    .replace(".cas", "");
                let buffer = new Uint8Array(request.result);
                self.list = self.msx.load(buffer, self.on_block_analysis);
                if (self.list.length > 0) {
                    self.player = new Player(self.list, self.on_job_completed);
                    self.player.on_audio_export = self.on_audio_export;
                    return true;
                }
                else {
                    if (typeof self.on_error !== "undefined") {
                        self.on_error(buffer);
                    }
                    return false;
                }
            }
        };
        request.readAsArrayBuffer(p_file);
    }
    load_from_remote_file(p_url, response) {
        let self = this;
        if (typeof self.on_load !== "undefined") {
            self.on_load(response.byteLength);
        }
        self.name = p_url
            .toLowerCase()
            .replace(".cas", "");
        this.list = self.msx.load(response, self.on_block_analysis);
        if (this.list.length > 0) {
            this.player = new Player(this.list, this.on_job_completed);
            this.player.on_audio_export = this.on_audio_export;
            return true;
        }
        else {
            if (typeof this.on_error !== "undefined") {
                this.on_error();
            }
            return false;
        }
    }
    load_from_buffer(p_buffer) {
        let result = false;
        this.list = this.msx.load(p_buffer, this.on_block_analysis);
        if (this.list.length > 0) {
            this.player = new Player(this.list, this.on_job_completed);
            this.player.on_audio_export = this.on_audio_export;
            result = true;
        }
        return result;
    }
    get_block(p_index) {
        return this.list[p_index];
    }
    get_length() {
        return this.list.length;
    }
}
if (typeof module !== "undefined") {
    module.exports = CassetteJS;
}
//# sourceMappingURL=cassettejs.js.map