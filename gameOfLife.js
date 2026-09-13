// I think instead of MAKING a grid, I use positions instead? idk it's just a small idea
// also I don't know how to use canvas in html
const canvas = document.getElementById("gameOfLifeCanvas");
const context = canvas.getContext("2d");
const pauseButton = document.getElementsByClassName("pause");

function pack(x,y){
    if(x == null || y == null){
        return null;
    }
    return (x/10 << 8) | y/10;
}

function unpack(packedNumber){
    return [(packedNumber >> 8)*10, (packedNumber & 255)*10];
}

function animate(){
    const kill = gameOfLife.getCandidateDeadCells();
    const birth = gameOfLife.getCandidateLiveCells();

    kill.forEach(killed => gameOfLife.deleteCell(killed));
    birth.forEach(birthed => gameOfLife.createCell(birthed));
}

function snapCoordinates(number){
    return Math.floor(number/10)*10;
}

function hover(event){
    const bounding = canvas.getBoundingClientRect();
    const x = snapCoordinates(event.clientX - bounding.left);
    const y = snapCoordinates(event.clientY - bounding.top);

    if(gameOfLife.cells.has(pack(x,y)) && lastHoveredOver != pack(x,y)){
        const [prevX, prevY] = unpack(lastHoveredOver);
        context.clearRect(prevX, prevY,10,10);
        return;
    }
    if(lastHoveredOver != pack(x,y)){
        const [prevX, prevY] = unpack(lastHoveredOver);
        context.clearRect(prevX, prevY,10,10);
        context.fillStyle = "rgba(0,0,0,0.4)";
        context.fillRect(x,y,10,10);
    }

    lastHoveredOver = pack(x,y);
}

function clearLastHover(event){
    const [prevX, prevY] = unpack(lastHoveredOver);
    context.clearRect(prevX,prevY,10,10);
}

function addCell(event){
    const bounding = canvas.getBoundingClientRect();
    const x = snapCoordinates(event.clientX - bounding.left);
    const y = snapCoordinates(event.clientY - bounding.top);

    if(gameOfLife.cells.has(pack(x,y))){
        gameOfLife.deleteCell([x,y]);
    } else{
        gameOfLife.createCell([x,y]);
    }

    lastHoveredOver = pack(1000,1000);
}

function pause(){
    if(!paused){
        window.clearInterval(animation);
        paused = !paused;
        pauseButton[0].style.background = "darkred";
        pauseButton[0].innerHTML = "RUN";
    } else{
        animation = window.setInterval(animate, 100);
        paused = !paused;
        pauseButton[0].style.background = "green";
        pauseButton[0].innerHTML = "PAUSE";
    }
}

class cell{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
    birth(){
        context.fillStyle = "rgba(0, 0, 0, 1)"
        context.fillRect(this.x,this.y,8,8);
    }
    kill(){
        context.clearRect(this.x,this.y,10,10);
    }
}

class cells{
    constructor(){
        this.cells = new Map();
    }
    createCell([x,y]){
        let C = new cell(x,y);
        let packed = pack(x,y);
        this.cells.set(packed, C);
        C.birth();
        return C;
    }
    deleteCell([x,y]){
        let C = this.cells.get(pack(x,y));
        C.kill();
        this.cells.delete(pack(x,y));
    }
    getNumberOfCells(){
        return this.cells.size;
    }
    getSurroundingLiveCells([x,y]){
        let liveCells = 0;
        const surroundingArray = [
            [-10,-10], [0,-10], [10,-10],
            [-10, 0], [10, 0],
            [-10, 10], [0, 10], [10, 10]
        ];
        for(const [xAdd, yAdd] of surroundingArray){
            if(this.cells.has(pack(x+xAdd, y+yAdd))){
                liveCells++;
            }
        }
        return liveCells;
    }
    getCandidateLiveCells(){
        const freqMap = new Map();
        const candidates = [];

        for(const [packedCoordinates, Cells] of this.cells){
            const x = Cells.x;
            const y = Cells.y;
            const surroundingArray = [
                [-10,-10], [0,-10], [10,-10],
                [-10, 0], [10, 0],
                [-10, 10], [0, 10], [10, 10]
            ];

            for(const [xAdd, yAdd] of surroundingArray){
                let xCoordinates = (x+xAdd > 990 || x+xAdd < 0) ? null : x+xAdd; 
                let yCoordinates = (y+yAdd > 990 || y+yAdd < 0) ? null : y+yAdd; 
                let packed = pack(xCoordinates, yCoordinates);
                if(this.cells.has(packed) || packed == null){
                    continue;
                }

                if(freqMap.has(packed)){
                    let frequency = freqMap.get(packed);
                    frequency++;
                    freqMap.set(packed, frequency);
                } else{
                    freqMap.set(packed, 1);
                }
            }
        }
        freqMap.forEach((val, key)=>{
            if(val == 3){
                candidates.push(unpack(key));
            }
        });
        return candidates;
    }
    getCandidateDeadCells(){
        const killList = [];
        this.cells.forEach((value, packedCoordinates) =>{
            const surroundings = this.getSurroundingLiveCells(unpack(packedCoordinates));
            if(surroundings > 3 || surroundings < 2){
                killList.push(unpack(packedCoordinates));
            }
        });
        return killList;
    }
}

const gameOfLife = new cells;
let lastHoveredOver = null;
let paused = false;

// test seed till I make a click-to-seed thingie
gameOfLife.createCell([500, 490]);
gameOfLife.createCell([500, 500]);
gameOfLife.createCell([500, 510]);
gameOfLife.createCell([490, 500]);
gameOfLife.createCell([510, 500]);
gameOfLife.cells.forEach(value => value.birth());

// animation loop
let animation = window.setInterval(animate, 100); 
canvas.addEventListener("mousemove", event => hover(event));
canvas.addEventListener("mouseout", event => clearLastHover(event));
canvas.addEventListener("click", event => {
    addCell(event);
});
