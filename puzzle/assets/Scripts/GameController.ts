import { _decorator, Component, Node, Prefab, instantiate, Sprite, Label } from 'cc';
import { CELL_WIDTH, BOARD_COLOR, ADD_NEAR_RATE, GameModel } from './GameModel'
import { PuzzleController } from './PuzzleController'
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {

    @property({type:Prefab})
    private cellPrefab:Prefab|null = null;
    @property({type:PuzzleController})
    private puzzleCtrl:PuzzleController|null = null;
    @property({type:Node})
    public startMenu:Node|null = null;
    @property({type:Label})
    public btnLabel:Label|null = null;
    @property({type:Label})
    public titleLabel:Label|null = null;

    start()
    {
        this.restart();
        this.puzzleCtrl?.node.on('onFitPuzzle', this.onFitPuzzle, this);
        this.puzzleCtrl?.node.on('onRemovePuzzle', this.onRemovePuzzle, this);
    }

    restart()
    {
        this.initBoard();
        this.puzzleCtrl?.initPuzzle();
    }

    update(deltaTime: number){}

    initBoard()
    {
        let board_length = GameModel.getBoardLength();
        if(!this.cellPrefab){
            return;
        }
        let board:number[][] = [];
        this.node.removeAllChildren();
        for(let i = 0; i < board_length; i++){
            let line = [];
            for(let j = 0; j < board_length; j++){
                let cell:Node|null = instantiate(this.cellPrefab);
                if(cell){
                    this.node.addChild(cell);
                    cell.setPosition(i * CELL_WIDTH, j * CELL_WIDTH, 0);
                    let cell_sprite = cell.getComponent(Sprite);
                    if(cell_sprite){
                        cell_sprite.color = BOARD_COLOR;
                    }
                    line.push(-1);
                }
            }
            board.push(line);
        }
        GameModel.setBoard(board);
        let pos = board_length * CELL_WIDTH * (-0.5) + CELL_WIDTH * (0.5);
        this.node.setPosition(pos, pos, 0);
        this.generatePuzzle(board);
    }

    generatePuzzle(_board:number[][])
    {
        let puzzles:number[][][] = [];
        for(let i = 0; i < _board.length; i++){
            for(let j = 0; j < _board[i].length; j++){
                if(_board[i][j] == -1){
                    puzzles.push([[i, j]]);
                    _board[i][j] = puzzles.length - 1;
                    this.addNearCell(puzzles, _board);
                    if(puzzles[puzzles.length - 1].length <= 1){
                        let [x, y] = puzzles[puzzles.length - 1][0];
                        let puzzle_id = this.findNearPuzzle(_board, x, y);
                        puzzles[puzzle_id].push(puzzles[puzzles.length - 1][0]);
                        puzzles.pop();
                        _board[x][y] = puzzle_id;
                    }
                }
            }
        }
        GameModel.setPuzzles(puzzles);
    }

    addNearCell(_puzzles:number[][][], _board:number[][])
    {
        let puzzle_id = _puzzles.length - 1;
        let puzzle = _puzzles[puzzle_id];
        let board:number[][] = _board.map(v => v.slice());
        let new_cell:number[][] = [];
        let direct = [[1, 0], [0, 1]];
        for(let i = 0; i < puzzle.length; i++){
            let [cx, cy] = puzzle[i];
            for(let j = 0; j < direct.length; j++){
                let [dx, dy] = direct[j];
                let [x, y] = [cx + dx, cy + dy];
                if(x < board.length && y < board[x].length && board[x][y] == -1){
                    new_cell.push([x, y]);
                    board[x][y] = 0;
                }
            }
        }
        if(new_cell.length > 0 && puzzle.length < ADD_NEAR_RATE.length){
            if(Math.random() < ADD_NEAR_RATE[puzzle.length]){
                let rand:number = Math.floor(Math.random() * new_cell.length);
                let [x, y] = new_cell[rand];
                _puzzles[puzzle_id].push(new_cell[rand]);
                _board[x][y] = puzzle_id;
                this.addNearCell(_puzzles, _board);
            }
        }
    }

    findNearPuzzle(_board:number[][], _x:number, _y:number)
    {
        let direct = [[-1, 0], [1, 0], [0, 1], [0, -1]];
        let near:number[][] = [];
        for(let i = 0; i < direct.length; i++){
            let [dx, dy] = direct[i];
            let [x, y] = [_x + dx, _y + dy];
            if(x >= 0 && y >= 0 && x < _board.length && y < _board[x].length){
                near.push([x, y]);
            }
        }
        let [nx, ny] = near[Math.floor(Math.random() * near.length)];
        return _board[nx][ny];
    }

    onFitPuzzle(_fit_cell:number[][], _name:string)
    {
        let puzzle_id = parseInt(_name);
        let board:number[][] = GameModel.getBoard().map(v => v.slice());
        for(let i = 0; i < _fit_cell.length; i++){
            let [x, y] = _fit_cell[i];
            if(board[x][y] == -1){
                board[x][y] = puzzle_id;
            }
            else{
                this.puzzleCtrl?.onFitPuzzleCallback(false);
                return;
            }
        }
        GameModel.setBoard(board);
        this.puzzleCtrl?.onFitPuzzleCallback(true);
        this.checkResult(board);
    }

    onRemovePuzzle(_fit_cell:number[][], _name:string)
    {
        let puzzle_id = parseInt(_name);
        let board:number[][] = GameModel.getBoard().map(v => v.slice());
        for(let i = 0; i < _fit_cell.length; i++){
            let [x, y] = _fit_cell[i];
            if(board[x][y] == puzzle_id){
                board[x][y] = -1;
            }
            else{
                return;
            }
        }
        GameModel.setBoard(board);
    }

    checkResult(_board:number[][])
    {
        for(let i = 0; i < _board.length; i++){
            for(let j = 0; j < _board[i].length; j++){
                if(_board[i][j] == -1){
                    return;
                }
            }
        }
        this.setMenuVisible(true);
        if(this.btnLabel){
            this.btnLabel.string = 'Next';
        }
        if(this.titleLabel){
            this.titleLabel.string = 'Congraduration!';
        }
        GameModel.setBoardLength(GameModel.getBoardLength() + 1);
        this.restart();
    }

    onStartButtonClicked()
    {
        this.setMenuVisible(false); //遊戲進行狀態
    }

    setMenuVisible(_show: boolean)
    {
        if(this.startMenu){
            this.startMenu.active = _show;
        }
    }
}


