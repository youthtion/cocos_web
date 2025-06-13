import { _decorator, Component, Node, Prefab, instantiate, Sprite, Label, EditBox, Color } from 'cc';
import { CELL_WIDTH, ADD_NEAR_RATE, EGameState, EGameEvents, EBuffType, GameModel } from './GameModel'
import { PuzzleController } from './PuzzleController'
import { BuffController } from './BuffController'
import { PreloadController } from './PreloadController'
const { ccclass, property } = _decorator;

const DOMAIN = 'https://youthtion.github.io/cocos_web/puzzle';
const BOARD_COLOR = new Color(64, 64, 64); //棋盤顏色
const OBSTACLE_COLOR = new Color(0, 0, 0);

@ccclass('GameController')
export class GameController extends Component {

    @property({type:Prefab})
    private cellPrefab:Prefab|null = null;
    @property({type:PuzzleController})
    private puzzleCtrl:PuzzleController|null = null;
    @property({type:BuffController})
    private buffCtrl:BuffController|null = null;
    @property({type:PreloadController})
    private preloadCtrl:PreloadController|null = null;
    @property({type:Node})
    private buffMenu:Node|null = null;
    @property({type:Node})
    private btnStart:Node|null = null;
    @property({type:Label})
    private titleLabel:Label|null = null;
    @property({type:Label})
    private stageLabel:Label|null = null;
    @property({type:Node})
    private shareBtn:Node|null = null;
    @property({type:Node})
    private shareMenu:Node|null = null;
    @property({type:EditBox})
    private shareEdit:EditBox|null = null;
    @property({type:Node})
    private screenshotBtn:Node|null = null;

    start()
    {
        this.preloadCtrl?.node.on(EGameEvents.GE_PRELOADED, this.onPreloadData, this);   //讀到query string或cookie
        this.buffCtrl?.node.on(EGameEvents.GE_ADD_BUFF, this.onStartButtonClicked, this);
    }

    changeGameState(_state:EGameState)
    {
        switch(_state){
            //場間階段
            case EGameState.GS_BUFF:
                GameModel.addStage();
                GameModel.removeBuff(EBuffType.BD_ROTATE);  //清除單場buff
                GameModel.removeBuff(EBuffType.BD_GRAVITY); //同上
                this.buffCtrl?.generateBuffList();
                this.buffCtrl?.showBuffBtn();
                this.puzzleCtrl?.setEventsActive(false);
                this.setEventsActive(false);
                break;
            //各場開始
            case EGameState.GS_START:
                //產生新一場資訊並初始化單局資訊
                this.initBoard();
                this.generatePuzzle();
                this.puzzleCtrl?.initPuzzle();
                this.puzzleCtrl?.setEventsActive(true);
                this.preloadCtrl?.setQueryString();
                this.preloadCtrl?.saveCookie();
                this.setEventsActive(true);
                break;
            //支援模式
            case EGameState.GS_HELP:
                //預讀單場資訊, 從生成實體開始初始化單局資訊
                this.puzzleCtrl?.initPuzzle();
                this.puzzleCtrl?.setEventsActive(true);
                this.preloadCtrl?.setQueryString();
                this.setEventsActive(true);
                GameModel.setHelpMode(true);
                break;
            //讀取進度
            case EGameState.GS_CONTINUE:
                //預讀單場資訊, 從生成實體開始初始化單局資訊
                this.puzzleCtrl?.initPuzzle();
                this.puzzleCtrl?.setEventsActive(true);
                this.preloadCtrl?.setQueryString();
                this.setEventsActive(true);
                break;
        }
        this.setMenuVisible(_state);
    }

    update(deltaTime: number){}

    setEventsActive(_set:boolean)
    {
        if(_set){
            this.puzzleCtrl?.node.on(EGameEvents.GE_PLACE_PUZZLE, this.onPlacePuzzle, this); //接收拼圖放上棋盤事件
            this.puzzleCtrl?.node.on(EGameEvents.GE_PICK_PUZZLE, this.onPickPuzzle, this);   //接收拼圖移出棋盤事件
        }
        else{
            this.puzzleCtrl?.node.off(EGameEvents.GE_PLACE_PUZZLE, this.onPlacePuzzle, this);
            this.puzzleCtrl?.node.off(EGameEvents.GE_PICK_PUZZLE, this.onPickPuzzle, this);
        }
    }

    //初始化棋盤資訊
    initBoard(_obstacle_set:Set<number> = new Set<number>())
    {
        if(!this.cellPrefab){
            return;
        }
        let board_length = GameModel.getBoardLength(); //棋盤大小
        let board:number[][] = []; //空棋盤資訊
        this.node.removeAllChildren(); //清除棋盤節點
        //根據缺格buff數生成底板缺格位置
        if(_obstacle_set.size == 0 && GameModel.getBuff(EBuffType.BD_OBSTACLE) > 0){
            let obstacle_buff = GameModel.getBuff(EBuffType.BD_OBSTACLE);
            let part_len = Math.floor(board_length * board_length / obstacle_buff);
            for(let i = 0; i < obstacle_buff; i++){
                _obstacle_set.add(Math.floor(Math.random() * part_len) + part_len * i);
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
                    if(_obstacle_set.size > 0 && _obstacle_set.has(i * board_length + j)){
                        if(cell_sprite){
                            cell_sprite.color = OBSTACLE_COLOR;
                        }
                        line.push(Infinity); //缺格填入無限
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
    }

    //生成拼圖資訊
    generatePuzzle()
    {
        let board:number[][] = GameModel.getBoard().map(v => v.slice());
        let puzzles:number[][][] = []; //空拼圖資訊
        let onecell_buff = GameModel.getBuff(EBuffType.BD_ONECELL);
        for(let i = 0; i < board.length; i++){
            for(let j = 0; j < board[i].length; j++){
                //遍歷棋盤資訊尋找初始格-1
                if(board[i][j] == -1){
                    let puzzle_id = puzzles.length;
                    //將i,j格設定為拼圖第一個CELL
                    puzzles.push([[i, j]]);
                    //先生成固定方塊(1x1 buff)
                    if(onecell_buff > 0){
                        board[i][j] = Infinity;
                        onecell_buff--;
                    }
                    else{
                        board[i][j] = puzzle_id;
                        this.addNearCell(puzzles, board); //遞迴生成鄰近CELL
                        //生成結果若只有1CELL, 加進鄰近拼圖
                        if(puzzles[puzzle_id].length <= 1){
                            let [x, y] = puzzles[puzzle_id][0];
                            let near_puzzle_id = this.findNearPuzzle(board, x, y);
                            puzzles[near_puzzle_id].push(puzzles[puzzle_id][0]);
                            puzzles.pop();
                            board[x][y] = near_puzzle_id;
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

    //拼圖放上棋盤事件
    onPlacePuzzle(_fit_cell:number[][], _name:string)
    {
        let gravity = GameModel.getBuff(EBuffType.BD_GRAVITY);
        //找方塊最高和最低y座標
        let [min_y, max_y] = [Infinity, -1];
        for(let i = 0; i < _fit_cell.length; i++){
            if(_fit_cell[i][1] < min_y){
                min_y = _fit_cell[i][1];
            }
            if(_fit_cell[i][1] > max_y){
                max_y = _fit_cell[i][1];
            }
        }
        let board:number[][] = GameModel.getBoard().map(v => v.slice());  //複製棋盤資訊
        let dy:number|null = null; //計算額外修改目標y軸移動格數(重力buff)
        //重力buff的目標y軸點(重力為底板底, 浮力為底板頂)
        let tar_y = 0;
        if(gravity > 0){
            tar_y = min_y - 0;
        }
        else if(gravity < 0){
            tar_y = board.length - 1 - max_y;
        }
        //從放置位往上(下)找到可放置拼圖的位置
        for(let i = 0; i <= tar_y; i++){
            let fit_cnt = 0;
            for(let j = 0; j < _fit_cell.length; j++){
                let [x, y] = _fit_cell[j];
                if(board[x][y - i * gravity] == -1){
                    fit_cnt++;
                }
                else{
                    break;
                }
            }
            //遍歷拼圖各cell可放置為可放置點, 紀錄dy
            if(fit_cnt == _fit_cell.length){
                dy = i * gravity;
            }
            else{
                break;
            }
        }
        //沒有可以放上的棋盤格, 回傳結果不更新棋盤資訊
        if(dy == null){
            this.puzzleCtrl?.onPlacePuzzleCallback(null);
            return;
        }
        let puzzle_id = parseInt(_name); //傳入拼圖id字串改為數字
        //放上拼圖成功回傳結果, 更新棋盤資訊
        for(let i = 0; i < _fit_cell.length; i++){
            let [x, y] = _fit_cell[i];
            board[x][y - dy] = puzzle_id;
        }
        GameModel.setBoard(board);
        this.puzzleCtrl?.onPlacePuzzleCallback(dy);
        this.checkResult(board); //勝利判定
    }

    //拼圖移出棋盤事件
    onPickPuzzle(_fit_cell:number[][], _name:string)
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
        this.changeGameState(EGameState.GS_START);
    }

    onShareBtnClick()
    {
        if(this.shareMenu){
            if(this.shareMenu.active == false){
                this.shareMenu.active = true;
            }
            else{
                this.shareMenu.active = false;
            }
        }
    }

    //複製query string
    async onCopyBtnClick()
    {
        if(this.shareEdit){
            await navigator.clipboard.writeText(this.shareEdit.string);
        }
    }

    onPreloadData(_obstacle_set:Set<number>, _state:EGameState)
    {
        this.initBoard(_obstacle_set);
        this.changeGameState(_state);
        this.preloadCtrl?.node.off(EGameEvents.GE_PRELOADED, this.onPreloadData, this); //讀檔成功只要一次
    }

    //勝利判定
    checkResult(_board:number[][])
    {
        if(GameModel.getHelpMode()){
            return;
        }
        //棋盤資訊填滿為勝利
        for(let i = 0; i < _board.length; i++){
            for(let j = 0; j < _board[i].length; j++){
                if(_board[i][j] == -1){
                    return;
                }
            }
        }
        this.changeGameState(EGameState.GS_BUFF);
    }

    //設定個狀態各類選單
    setMenuVisible(_state:EGameState)
    {
        if(this.stageLabel){
            this.stageLabel.string = _state == EGameState.GS_START || _state == EGameState.GS_CONTINUE ? 'Stage' + GameModel.getStage() : '';
        }
        if(this.buffMenu){
            this.buffMenu.active = _state == EGameState.GS_BUFF;
        }
        if(this.shareBtn){
            this.shareBtn.active = _state != EGameState.GS_BUFF;
        }
        if(this.shareMenu){
            this.shareMenu.active = false;
        }
        if(this.btnStart){
            this.btnStart.active = false;
        }
        if(this.titleLabel){
            this.titleLabel.string = '';
        }
        if(this.screenshotBtn){
            this.screenshotBtn.active = _state == EGameState.GS_HELP;
        }
        if(this.shareEdit){
            this.shareEdit.string = DOMAIN + '?' + GameModel.getQueryString();
        }
    }
}


