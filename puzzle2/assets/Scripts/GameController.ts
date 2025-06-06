import { _decorator, Component, Node, Prefab, instantiate, Sprite, Label } from 'cc';
import { CELL_WIDTH, BOARD_COLOR, OBSTACLE_COLOR, ADD_NEAR_RATE, GameModel } from './GameModel'
import { PuzzleController } from './PuzzleController'
import { BuffController } from './BuffController'
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {

    @property({type:Prefab})
    private cellPrefab:Prefab|null = null;
    @property({type:PuzzleController})
    private puzzleCtrl:PuzzleController|null = null;
    @property({type:BuffController})
    private buffCtrl:BuffController|null = null;
    @property({type:Node})
    public startMenu:Node|null = null;
    @property({type:Node})
    public btnStart:Node|null = null;
    @property({type:Label})
    public titleLabel:Label|null = null;
    @property({type:Label})
    public stageLabel:Label|null = null;

    start()
    {
        this.puzzleCtrl?.node.on('onFitPuzzle', this.onFitPuzzle, this); //接收拼圖放上棋盤事件
        this.puzzleCtrl?.node.on('onFallPuzzle', this.onFallPuzzle, this); //接收拼圖放上棋盤事件
        this.puzzleCtrl?.node.on('onRemovePuzzle', this.onRemovePuzzle, this); //接收拼圖移出棋盤事件
        this.buffCtrl?.node.on('onSetBuffFinish', this.onStartButtonClicked, this);
    }

    //初始化單局資訊
    restart()
    {
        //更新棋盤大小並初始化單局資訊
        if(this.stageLabel){
            this.stageLabel.string = 'Stage' + GameModel.getStage();
        }
        this.initBoard();
        this.puzzleCtrl?.initPuzzle();
    }

    update(deltaTime: number){}

    //初始化棋盤資訊
    initBoard()
    {
        if(!this.cellPrefab){
            return;
        }
        let board_length = GameModel.getBoardLength(); //棋盤大小
        let board:number[][] = []; //空棋盤資訊
        this.node.removeAllChildren(); //清除棋盤節點
        let rand_obstacle_set = new Set<number>();
        if(GameModel.getObstacleBuff() > 0){
            let obstacle_buff = GameModel.getObstacleBuff();
            let part_len = Math.floor(board_length * board_length / obstacle_buff);
            for(let i = 0; i < obstacle_buff; i++){
                rand_obstacle_set.add(Math.floor(Math.random() * part_len) + part_len * i);
            }
        }
        for(let i = 0; i < board_length; i++){
            let line = [];
            for(let j = 0; j < board_length; j++){
                //生成ixj個cell加入棋盤節點
                let cell:Node|null = instantiate(this.cellPrefab);
                if(cell){
                    this.node.addChild(cell);
                    cell.setPosition(i * CELL_WIDTH, j * CELL_WIDTH, 0);
                    let cell_sprite = cell.getComponent(Sprite);
                    if(rand_obstacle_set.size > 0 && rand_obstacle_set.has(i * board_length + j)){
                        if(cell_sprite){
                            cell_sprite.color = OBSTACLE_COLOR;
                        }
                        line.push(Infinity);
                    }
                    else{
                        if(cell_sprite){
                            cell_sprite.color = BOARD_COLOR;
                        }
                        line.push(-1); //初始棋盤資訊每格填入-1
                    }
                }
            }
            board.push(line);
        }
        GameModel.setBoard(board); //更新棋盤資訊給GameModel
        //棋盤節點置中於畫面
        let pos = board_length * CELL_WIDTH * (-0.5) + CELL_WIDTH * (0.5);
        this.node.setPosition(pos, pos, 0);
        this.generatePuzzle(board); //生成拼圖
    }

    //生成拼圖
    generatePuzzle(_board:number[][])
    {
        let puzzles:number[][][] = []; //空拼圖資訊
        let onecell_buff = GameModel.getOnecellBuff();
        for(let i = 0; i < _board.length; i++){
            for(let j = 0; j < _board[i].length; j++){
                //遍歷棋盤資訊尋找初始格-1
                if(_board[i][j] == -1){
                    let puzzle_id = puzzles.length;
                    //將i,j格設定為拼圖第一個CELL
                    puzzles.push([[i, j]]);
                    if(onecell_buff > 0){
                        _board[i][j] = Infinity;
                        onecell_buff--;
                    }
                    else{
                        _board[i][j] = puzzle_id;
                        this.addNearCell(puzzles, _board); //遞迴生成鄰近CELL
                        //生成結果若只有1CELL, 加進鄰近拼圖
                        if(puzzles[puzzle_id].length <= 1){
                            let [x, y] = puzzles[puzzle_id][0];
                            let near_puzzle_id = this.findNearPuzzle(_board, x, y);
                            puzzles[near_puzzle_id].push(puzzles[puzzle_id][0]);
                            puzzles.pop();
                            _board[x][y] = near_puzzle_id;
                        }
                    }
                }
            }
        }
        GameModel.setPuzzles(puzzles); //更新拼圖資訊給GameModel
    }

    //遞迴生成鄰近CELL
    addNearCell(_puzzles:number[][][], _board:number[][])
    {
        let puzzle_id = _puzzles.length - 1;
        let puzzle = _puzzles[puzzle_id];
        let board:number[][] = _board.map(v => v.slice()); //複製棋盤資訊暫時修改
        let new_cell:number[][] = []; //候選生成CELL
        let direct = [[1, 0], [0, 1]]; //往右下尋找可生成CELL(避免太容易壓縮其他拼圖生成空間不往左上生成)
        //遍歷現有CELL
        for(let i = 0; i < puzzle.length; i++){
            let [cx, cy] = puzzle[i]; //CELL的x,y
            //搜尋右與下棋盤
            for(let j = 0; j < direct.length; j++){
                let [dx, dy] = direct[j];
                let [x, y] = [cx + dx, cy + dy]; //右與下CELL的x,y
                //若在棋盤範圍內且未被占用(-1)則加入候選
                if(x < board.length && y < board[x].length && board[x][y] == -1){
                    new_cell.push([x, y]);
                    board[x][y] = 0; //選入CELL後棋盤上設定為佔用
                }
            }
        }
        //若有候選且CELL數在機率表長度內
        if(new_cell.length > 0 && puzzle.length < ADD_NEAR_RATE.length){
            //機率表抽選是否生成
            let add_near_rate = this.buffCtrl?.getBuffAddNearRate().slice();
            if(Math.random() < add_near_rate[puzzle.length]){
                //生成成功由候選隨機1個CELL加入
                let rand:number = Math.floor(Math.random() * new_cell.length);
                let [x, y] = new_cell[rand];
                _puzzles[puzzle_id].push(new_cell[rand]);
                _board[x][y] = puzzle_id; //設定棋盤上佔用
                this.addNearCell(_puzzles, _board); //繼續生成鄰近CELL
            }
        }
    }

    //尋找鄰近拼圖
    findNearPuzzle(_board:number[][], _x:number, _y:number):number
    {
        let direct = [[-1, 0], [1, 0], [0, 1], [0, -1]]; //4方向
        let near:number[][] = [];
        //尋找棋盤範圍內且已被佔用的鄰近CELL
        for(let i = 0; i < direct.length; i++){
            let [dx, dy] = direct[i];
            let [x, y] = [_x + dx, _y + dy];
            if(x >= 0 && y >= 0 && x < _board.length && y < _board[x].length && _board[x][y] > -1 && _board[x][y] != Infinity){
                near.push([x, y]);
            }
        }
        //抽選其中一個鄰近CELL的佔用拼圖ID回傳
        if(near.length > 0){
            let [nx, ny] = near[Math.floor(Math.random() * near.length)];
            return _board[nx][ny];
        }
        return 0;
    }

    onFallPuzzle(_fit_cell:number[][], _name:string)
    {
        let min_y = Infinity;
        for(let i = 0; i < _fit_cell.length; i++){
            if(_fit_cell[i][1] < min_y){
                min_y = _fit_cell[i][1];
            }
        }
        let board:number[][] = GameModel.getBoard().map(v => v.slice());
        let last_y = -1;
        for(let i = 0; i <= min_y; i++){
            let fit_cnt = 0;
            for(let j = 0; j < _fit_cell.length; j++){
                let [x, y] = _fit_cell[j];
                if(board[x][y - i] == -1){
                    fit_cnt++;
                }
                else{
                    break;
                }
            }
            if(fit_cnt == _fit_cell.length){
                last_y = i;
            }
            else{
                break;
            }
        }
        if(last_y == -1){
            this.puzzleCtrl?.onFitPuzzleCallback(false);
            return;
        }
        let puzzle_id = parseInt(_name);
        for(let i = 0; i < _fit_cell.length; i++){
            let [x, y] = _fit_cell[i];
            board[x][y - last_y] = puzzle_id;
        }
        GameModel.setBoard(board);
        this.puzzleCtrl?.onFallPuzzleCallback(last_y);
        this.checkResult(board); //勝利判定
    }

    //拼圖放上棋盤事件
    onFitPuzzle(_fit_cell:number[][], _name:string)
    {
        let puzzle_id = parseInt(_name); //傳入拼圖id字串改為數字
        let board:number[][] = GameModel.getBoard().map(v => v.slice()); //複製棋盤資訊暫時修改(結果判定為失敗就不更新)
        //判定每個CELL的棋盤資訊都是-1, 填入拼圖id
        for(let i = 0; i < _fit_cell.length; i++){
            let [x, y] = _fit_cell[i];
            if(board[x][y] == -1){
                board[x][y] = puzzle_id;
            }
            //遇到佔用格回傳結果, 不更新棋盤資訊
            else{
                this.puzzleCtrl?.onFitPuzzleCallback(false);
                return;
            }
        }
        //放上拼圖成功回傳結果, 更新棋盤資訊
        GameModel.setBoard(board);
        this.puzzleCtrl?.onFitPuzzleCallback(true);
        this.checkResult(board); //勝利判定
    }

    //拼圖移出棋盤事件
    onRemovePuzzle(_fit_cell:number[][], _name:string)
    {
        let puzzle_id = parseInt(_name); //傳入拼圖id字串改為數字
        let board:number[][] = GameModel.getBoard().map(v => v.slice()); //複製棋盤資訊暫時修改(結果判定為失敗就不更新)
        //判定每個CELL的棋盤資訊都是拼圖id, 填入-1
        for(let i = 0; i < _fit_cell.length; i++){
            let [x, y] = _fit_cell[i];
            if(board[x][y] == puzzle_id){
                board[x][y] = -1;
            }
            //遇到非拼圖格, 不更新棋盤資訊
            else{
                return;
            }
        }
        GameModel.setBoard(board); //移出拼圖成功, 更新棋盤資訊
    }

    onStartButtonClicked()
    {
        this.setMenuVisible(false); //遊戲進行, 隱藏選單
        this.restart();
    }

    //勝利判定
    checkResult(_board:number[][])
    {
        //棋盤資訊填滿為勝利
        for(let i = 0; i < _board.length; i++){
            for(let j = 0; j < _board[i].length; j++){
                if(_board[i][j] == -1){
                    return;
                }
            }
        }
        //叫出選單, 顯示勝利資訊
        this.setMenuVisible(true);
        if(this.btnStart){
            this.btnStart.active = false;
        }
        if(this.titleLabel){
            this.titleLabel.string = '';
        }
        if(this.stageLabel){
            this.stageLabel.string = '';
        }
        this.buffCtrl?.generateBuffList();
        this.buffCtrl?.showBuffBtn();
        GameModel.setStage(GameModel.getStage() + 1);
        GameModel.setCannotRotateBuff(false);
        GameModel.setGravityBuff(false);
    }

    setMenuVisible(_show: boolean)
    {
        if(this.startMenu){
            this.startMenu.active = _show;
        }
    }
}


