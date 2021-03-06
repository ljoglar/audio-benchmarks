// import Meyda from 'meyda'
import fs from 'fs'
import path from 'path';
import Benchmark from 'benchmark'

import Essentia from '../../dist/essentia/essentia.js-core.es.js';
// import essentia-wasm backend
import { EssentiaWASM } from '../../dist/essentia/essentia-wasm.module.js';

let essentia = new Essentia(EssentiaWASM);
const __dirname = path.resolve();

const FRAME_SIZE = 2048;
const HOP_SIZE = 1024;
const audioFilePath = path.join(__dirname, '..', '..','audio', 'mozart_c_major_5sec.wav');
var options = {};
if (process.argv[2] !== undefined){
    options = {
            minSamples: process.argv[2],
            initCount: 1,
            minTime: -Infinity,
            maxTime: -Infinity,
            };
}

fs.readFile(audioFilePath, (err, data) => {
    if (err) throw err;
    let audioBuffer = data;
    const suite = new Benchmark.Suite('MELBANDS');

    // add tests
    suite
    // .add('Meyda#MelBands', () => {
    //     for (let i = 0; i < audioBuffer.length/HOP_SIZE; i++) {
    //         Meyda.bufferSize = FRAME_SIZE;
    //         let frame = audioBuffer.slice(HOP_SIZE*i, HOP_SIZE*i + FRAME_SIZE);
    //         if (frame.length !== FRAME_SIZE) {
    //             frame = Buffer.concat([frame], FRAME_SIZE);
    //         }
    //         Meyda.extract([''], frame);
    //     }
    // }, options)
    .add('Essentia#MelBands', () => {        
        const frames = essentia.FrameGenerator(audioBuffer, FRAME_SIZE, HOP_SIZE);
        for (var i = 0; i < frames.size(); i++){
            var frame_windowed = essentia.Windowing(frames.get(i),true, FRAME_SIZE);
            essentia.MelBands(essentia.Spectrum(frame_windowed['frame'])['spectrum'], 22050, 1025, false, 0, 'unit_sum', 128);
        }
    }, options)
    // add listeners
    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    
    .on('complete', function() {
        // console.log(this);
        console.log('Fastest is ' + this.filter('fastest').map('name'));

        const resultsObj = {
            // "meyda": {
            //     "mean": this[0].stats.mean,
            //     "moe": this[0].stats.moe,
            //     "rme": this[0].stats.rme,
            //     "sem": this[0].stats.sem,
            //     "deviation": this[0].stats.deviation,
            //     "variance": this[0].stats.variance,
            //     "execution times": this[0].stats.sample,
            //     "cycle": this[0].times.cycle,
            //     "elapsed": this[0].times.elapsed,
            //     "period": this[0].times.period,
            //     "timeStamp": this[0].times.timeStamp,
            //     "count": this[0].count,
            //     "cycles": this[0].cycles,
            //     "hz": this[0].hz
            // },
            "essentia": {
                "mean": this[0].stats.mean,
                "moe": this[0].stats.moe,
                "rme": this[0].stats.rme,
                "sem": this[0].stats.sem,
                "deviation": this[0].stats.deviation,
                "variance": this[0].stats.variance,
                "execution times": this[0].stats.sample,
                "cycle": this[0].times.cycle,
                "elapsed": this[0].times.elapsed,
                "period": this[0].times.period,
                "timeStamp": this[0].times.timeStamp,
                "count": this[0].count,
                "cycles": this[0].cycles,
                "hz": this[0].hz
            }
        }

        var json = JSON.stringify(resultsObj);
        fs.writeFile('mel_bands.json', json, 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing MelBands JSON Object to File.");
                return console.log(err);
            }

            console.log("MelBands JSON file has been saved.");
        });
    })
    // run async
    .run({ 'async': true });       
  });