let tempo = document.getElementById("definir-tempo"); //pega o valor do input
let temporizador = document.getElementById("temporizador");

let definirTempo = document.getElementById("definir-tempo");

let iniciar = document.getElementById("iniciar");

let tempoEmSegundos = 0;

let intervalo;

let rodando = false;

let placar01 = document.getElementById("contador-placar-at01");

let contagemPontos02 = document.getElementById("add-ponto-at01-02");

let contagemPontos03 = document.getElementById("add-ponto-at01-03");

let contagemPontos04 = document.getElementById("add-ponto-at01-04");

let contagemVantagem = document.getElementById("contador-vantagem-at01");

let addVantagem = document.getElementById("add-vantagem-at01");

let removeVantagem = document.getElementById("remove-vantagem-at01")

let contagemFaltas = document.getElementById("contador-faltas-at01");

let addFaltas = document.getElementById("add-faltas-at01");

let removeFaltas = document.getElementById("remove-faltas-at01");

let placar02 = document.getElementById("contador-placar-at02");

let contagemPontos02At02 = document.getElementById("add-ponto-at02-02");

let contagemPontos03At02 = document.getElementById("add-ponto-at02-03");

let contagemPontos04At02 = document.getElementById("add-ponto-at02-04");

let contagemVantagemAt02 = document.getElementById("contador-vantagem-at02")

let addVantagemAt02 = document.getElementById("add-vantagem-at02")

let removeVantagemAt02 = document.getElementById("remove-vantagem-at02")

let contagemFaltasAt02 = document.getElementById("contador-faltas-at02")

let addFaltasAt02 = document.getElementById("add-faltas-at02-02")

let removeFaltasAt02 = document.getElementById("remove-faltas-at02-02")
 
let historicoDePontosAt01 = [0];

let historicoDePontosAt02 = [0];


function tempoLuta() {
    temporizador.textContent = tempo.value;//insere o valor do input na tag time do html
}

//adicionar um evento à variável
definirTempo.addEventListener("keydown", function (event) {
    if (event.key === "Enter") { tempoLuta(); } //insere o valor do input na tag time do html

     if (definirTempo.value === "") {
            return temporizador.textContent = "00:00 min";
        }
});


function iniciarCronometro() {

    if (rodando === false) {
        if (tempoEmSegundos === 0) {
            let tempo = definirTempo.value.split(":");  //transforma a string em um array de duas posições separados pelo :

            let minutos = parseInt(tempo[0]);

            let segundos = parseInt(tempo[1]);

            tempoEmSegundos = (minutos * 60) + segundos;

        }

        //iniciar a contagem 
        intervalo = setInterval(function () {
            if (tempoEmSegundos > 0) {

                tempoEmSegundos = tempoEmSegundos - 1;

                let minutos = Math.floor(tempoEmSegundos / 60);
                let segundos = Math.floor(tempoEmSegundos % 60);

                minutos = String(minutos).padStart(2, "0");
                segundos = String(segundos).padStart(2, "0");

                temporizador.textContent = `${minutos}:${segundos}`;  //adiciona a contagem ao temporizador
            }

            //parar acontagem
            if (tempoEmSegundos <= 0) {
                clearInterval(intervalo);

                rodando = false;

                iniciar.textContent = "Iniciar";

                let audio = new Audio("sons/u_inx5oo5fv3-alarm-327234.mp3");

                audio.play();
            }
        }, 1000);


        rodando = true;

        iniciar.textContent = "Pausar";
    }

    else {
        clearInterval(intervalo);

        rodando = false;

        iniciar.textContent = "Iniciar";
    }

}

function resetTempo() {
    tempo = definirTempo.value.split(":");

    let minutos = parseInt(tempo[0]);
    let segundos = parseInt(tempo[1]);

    tempoEmSegundos = (minutos * 60) + segundos;
    
    temporizador.textContent = definirTempo.value;

    if(tempo === 0){

        temporizador.textContent = "00:00 min" ;
    }

}



function contarPontuaçãoMais02() {

    contagemPontos02 = Number(placar01.textContent); //o number transforma a string em número, permitindo a adição de +2 ao placar

    contagemPontos02 = contagemPontos02 + 2;

    placar01.textContent = contagemPontos02;

    historicoDePontosAt01.push(2);

    console.log(placar01.textContent);

}

function contarPontuaçãoMais03() {

    contagemPontos03 = Number(placar01.textContent);

    contagemPontos03 = contagemPontos03 + 3;

    placar01.textContent = contagemPontos03;

    historicoDePontosAt01.push(3);
}

function contarPontuaçãoMais04() {

    contagemPontos04 = Number(placar01.textContent);

    contagemPontos04 = contagemPontos04 + 4;

    placar01.textContent = contagemPontos04;

   historicoDePontosAt01.push(4);

}

function removerUltimoPontoAt01(){


    if(historicoDePontosAt01.length === 0){
       return placar01.textContent = Number(0);
    }

    let pontoAtualAt01 = Number(placar01.textContent);

    pontoAtualAt01 = pontoAtualAt01 - historicoDePontosAt01.pop(); // .pop() remove o último ponto do array e subtrai do placar

    placar01.textContent = pontoAtualAt01;


}

function addvantagem() {
    addVantagem = Number(contagemVantagem.textContent);

    addVantagem = addVantagem + 1;

    contagemVantagem.textContent = addVantagem;
}


function removevantagem() {

    removeVantagem = Number(contagemVantagem.textContent);

    removeVantagem = removeVantagem - 1;

    contagemVantagem.textContent = removeVantagem;

    if (removeVantagem < 0) {
        contagemVantagem.textContent = 0;
    } // impede contagem negativa

}

function addfaltas() {
    addFaltas = Number(contagemFaltas.textContent);

    addFaltas = addFaltas + 1;

    contagemFaltas.textContent = addFaltas;
}

function removefaltas() {
    removeFaltas = Number(contagemFaltas.textContent);

    removeFaltas = removeFaltas - 1;

    contagemFaltas.textContent = removeFaltas;

    if (removeFaltas < 0) {
        contagemFaltas.textContent = 0;
    }
}

function contarPontuaçãoMais02At02() {

    contagemPontos02At02 = Number(placar02.textContent); //o number transforma a string em número, permitindo a adição de +2 ao placar

    contagemPontos02At02 = contagemPontos02At02 + 2;

    placar02.textContent = contagemPontos02At02;

    historicoDePontosAt02.push(2);

}

function contarPontuaçãoMais03At02() {

    contagemPontos03At02 = Number(placar02.textContent);

    contagemPontos03At02 = contagemPontos03At02 + 3;

    placar02.textContent = contagemPontos03At02;
    
    historicoDePontosAt02.push(3);
}

function contarPontuaçãoMais04At02() {

    contagemPontos04At02 = Number(placar02.textContent);

    contagemPontos04At02 = contagemPontos04At02 + 4;

    placar02.textContent = contagemPontos04At02;
    
   historicoDePontosAt02.push(4);

}

function removerUltimoPontoAt02(){


    if(historicoDePontosAt02.length === 0){
        return placar02.textContent = 0;
    }
    

    let pontoAtualAt02 = Number(placar02.textContent);

    pontoAtualAt02 = pontoAtualAt02 - historicoDePontosAt02.pop();

    placar02.textContent = pontoAtualAt02;

    
}

function addvantagemAt02() {
    addVantagemAt02 = Number(contagemVantagemAt02.textContent);

    addVantagemAt02 = addVantagemAt02 + 1;

    contagemVantagemAt02.textContent = addVantagemAt02;
}

function removevantagemAt02() {

    removeVantagemAt02 = Number(contagemVantagemAt02.textContent);

    removeVantagemAt02 = removeVantagemAt02 - 1;

    contagemVantagemAt02.textContent = removeVantagemAt02;

    if (removeVantagemAt02 < 0) {
        contagemVantagemAt02.textContent = 0;
    } // impede contagem negativa

}

function addfaltasAt02() {
    addFaltasAt02 = Number(contagemFaltasAt02.textContent);

    addFaltasAt02 = addFaltasAt02 + 1;

    contagemFaltasAt02.textContent = addFaltasAt02;
}

function removefaltasAt02() {
    removeFaltasAt02 = Number(contagemFaltasAt02.textContent);

    removeFaltasAt02 = removeFaltasAt02 - 1;

    contagemFaltasAt02.textContent = removeFaltasAt02;

    if (removeFaltasAt02 < 0) {
        contagemFaltasAt02.textContent = 0;
    }
}