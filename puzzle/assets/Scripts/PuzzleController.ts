import { _decorator, Component, Node, Prefab, instantiate, Sprite, Color, Input, EventMouse, input, Vec3, UITransform, CCFloat } from 'cc';
import { CELL_WIDTH, FIT_ALLOW, EBuffType, GameModel } from './GameModel'
const { ccclass, property } = _decorator;

//滑鼠點擊類型(對應event.getButton)
enum EMouseType{
    MT_LEFT, //左鍵
    MT_MID,  //中鍵
    MT_RIGHT,//右鍵
}

@ccclass('PuzzleController')
export class PuzzleController extends Component {

    @property({type:Prefab})
    private cellPrefab:Prefab|null = null;
    @property({type:CCFloat, min:0, max:1, step:0.01})
    private cellSaturation:number = 0;
    @property({type:CCFloat, min:0, max:1, step:0.01})
    private cellLightness:number = 0; 

    start(){}

    update(deltaTime: number){}

    setEventsActive(_set:boolean)
    {
        if(_set){
            input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this); //拼圖移動事件
            input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);     //拼圖放下事件
        }
        else{
            input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
            input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        }
    }

    //生成拼圖實體
    initPuzzle()
    {
        if(!this.cellPrefab){
            return;
        }
        let board:number[][] = GameModel.getBoard(); //從GameModel取得棋盤資訊
        let puzzles:number[][][] = GameModel.getPuzzles().map(v0 => v0.map(v1 => v1.slice())); //從GameModel取得拼圖資訊
        let colors:Color[] = this.generateHueColors(puzzles.length * (GameModel.getBuff(EBuffType.BD_HUE) + 1));
        this.node.removeAllChildren(); //清除拼圖節點下所有拼圖
        for(let i = 0; i < puzzles.length; i++){
            let puzzle:Node = new Node("" + i); //生成拼圖節點, 名稱i
            let [bx, by] = puzzles[i][0]; //拼圖第一個CELL的座標bx,by
            for(let j = 0; j < puzzles[i].length; j++){
                let cell:Node|null = instantiate(this.cellPrefab); //生成CELL
                if(cell){
                    puzzle.addChild(cell);
                    let [x, y] = puzzles[i][j]; //該CELL的座標x,y
                    cell.setPosition((x - bx) * CELL_WIDTH, (y - by) * CELL_WIDTH, 0); //各CELL位置都減少第一座標bx,by距離, 讓拼圖整體移動到0,0附近
                    let cell_sprite = cell.getComponent(Sprite);
                    if(cell_sprite){
                        cell_sprite.color = colors[i]; //修改顏色
                    }
                    cell.on(Input.EventType.MOUSE_DOWN, (event: EventMouse) => {this.onMouseDown(event, puzzle);}, this); //拼圖抓取&旋轉事件, 傳入點擊的拼圖節點
                    cell.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this); //拼圖移動事件(同input, 游標在CELL上時處理)
                    cell.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);     //拼圖放下事件(同input, 游標在CELL上時處理)
                }
            }
            if(GameModel.getBuff(EBuffType.BD_ROTATE) == 0){
                puzzle.eulerAngles = new Vec3(puzzle.eulerAngles.x, puzzle.eulerAngles.y, puzzle.eulerAngles.z + 90 * Math.floor(Math.random() * 4));
            }
            puzzle.setPosition((board.length * CELL_WIDTH * (-1)), 0, 0);
            this.node.addChild(puzzle);
        }
    }

    //拼圖抓取&旋轉事件
    onMouseDown(_event: EventMouse, _puzzle:Node)
    {
        if(!_puzzle.parent){
            return;
        }
        _puzzle.setSiblingIndex(_puzzle.parent.children.length - 1); //設定點擊拼圖置頂
        this.getFitCell(_puzzle); //取得拼圖重疊棋盤格資訊
        //重疊棋盤格與拼圖大小一致, 處理拼圖移出棋盤
        if(this.fitCells.length == _puzzle.children.length){
            this.node.emit('onRemovePuzzle', this.fitCells, _puzzle.name);
        }
        //右鍵旋轉
        if(GameModel.getBuff(EBuffType.BD_ROTATE) == 0 && _event.getButton() == EMouseType.MT_RIGHT){
            //游標在畫面上的座標轉換在PuzzleController中的座標
            let cur_pos = new Vec3(_event.getUILocation().x, _event.getUILocation().y, 0);
            let pos_in_parent = _puzzle.parent.getComponent(UITransform).convertToNodeSpaceAR(cur_pos);
            //座標與puzzle位置設定差
            let puzzle_pos = _puzzle.getPosition();
            let offset = new Vec3(pos_in_parent.x - puzzle_pos.x, pos_in_parent.y - puzzle_pos.y, 0);
            let [cos, sin] = [Math.cos(Math.PI / (-2)), Math.sin(Math.PI / (-2))]; //旋轉弧度(-90度)
            //設定新位置以游標在PuzzleController中的座標為旋轉中心, 扣除旋轉後與puzzle位置設定差
            let [rx, ry] = [offset.x * cos - offset.y * sin, offset.x * sin + offset.y * cos];
            let [nx, ny] = [pos_in_parent.x - rx, pos_in_parent.y - ry];
            _puzzle.setPosition(nx, ny, 0);
            _puzzle.eulerAngles = new Vec3(_puzzle.eulerAngles.x, _puzzle.eulerAngles.y, (_puzzle.eulerAngles.z - 90) % 360);
        }
        //左鍵抓取拼圖紀錄puzzle開始位置設定, 游標位置, 拼圖節點
        else if(_event.getButton() == EMouseType.MT_LEFT && !this.dragPuzzle){
            this.puzzleStartPos.set(_puzzle.getPosition());
            this.dragStartPos.set(_event.getUILocation().x, _event.getUILocation().y, 0);
            this.dragPuzzle = _puzzle;
        }
    }

    onMouseMove(_event: EventMouse)
    {
        //若游標移動中有紀錄的拼圖節點
        if(this.dragPuzzle){
            //計算游標移動量, 設定puzzle開始位置差
            let cur_pos = _event.getUILocation();
            let [dx, dy] = [this.dragStartPos.x - cur_pos.x, this.dragStartPos.y - cur_pos.y];
            this.dragPuzzle.setPosition(this.puzzleStartPos.x - dx, this.puzzleStartPos.y - dy);
        }
    }

    onMouseUp(_event: EventMouse)
    {
        //若游標放開時有紀錄的拼圖節點
        if(this.dragPuzzle){
            this.getFitCell(this.dragPuzzle); //取得拼圖重疊棋盤格資訊
            //重疊棋盤格與拼圖大小一致, 處理拼圖放入棋盤
            if(this.fitCells.length == this.dragPuzzle.children.length){
                this.node.emit('onFitPuzzle', this.fitCells, this.dragPuzzle.name);    
                return;
            }
            this.dragPuzzle = null;
        }
    }

    getFitCell(_puzzle:Node)
    {
        let [dx, dy] = [0, 0];
        this.fitCells = [];
        if(!_puzzle.parent){
            return;
        }
        let board:number[][] = GameModel.getBoard(); //從GameModel取得棋盤資訊
        for(let i = 0; i < _puzzle.children.length; i++){
            //各CELL在畫面上的座標轉換在PuzzleController中的座標x,y
            let cur_pos = _puzzle.children[i].getWorldPosition();
            let pos_in_parent = _puzzle.parent.getComponent(UITransform).convertToNodeSpaceAR(cur_pos);
            let [x, y] = [pos_in_parent.x, pos_in_parent.y];
            //畫面棋盤座標為中央0, 上下左右各一半棋盤長度, 判斷x,y是否在棋盤範圍+吸附範圍(FIT_ALLOW)內
            if(Math.abs(x) > CELL_WIDTH * (board.length - 1) / 2 + FIT_ALLOW || Math.abs(y) > CELL_WIDTH * (board.length - 1) / 2 + FIT_ALLOW){
                break;
            }
            //計算CELL座標是否在棋盤格吸附範圍內, 偶數長度的棋盤中央非棋盤格調整x,y
            if(board.length % 2 == 0){
                [x, y] = [x + CELL_WIDTH * 0.5, y + CELL_WIDTH * 0.5];
            }
            //CELL座標除以棋盤格, 判斷餘數是否在一單位格的+-吸附範圍內
            if(Math.abs(x % CELL_WIDTH) > FIT_ALLOW && Math.abs(x % CELL_WIDTH) < CELL_WIDTH - FIT_ALLOW){
                break;
            }
            if(Math.abs(y % CELL_WIDTH) > FIT_ALLOW && Math.abs(y % CELL_WIDTH) < CELL_WIDTH - FIT_ALLOW){
                break;
            }
            //確認CELL在棋盤範圍內且在棋盤格吸附範圍, 計算實際偏差量
            if(dx == 0 && dy == 0){
                dx = (x % CELL_WIDTH + CELL_WIDTH) % CELL_WIDTH;
                if(dx > FIT_ALLOW){
                    dx -= CELL_WIDTH;
                }
                dy = (y % CELL_WIDTH + CELL_WIDTH) % CELL_WIDTH;
                if(dy > FIT_ALLOW){
                    dy -= CELL_WIDTH;
                }
                //紀錄puzzle位置設定與扣除偏差量後的位置(吸附後的位置)
                let puzzle_pos = _puzzle.getPosition();
                this.fitPuzzlePos = [puzzle_pos.x - dx, puzzle_pos.y - dy];
            }
            //再將x,y扣除吸附偏差調整為吻合棋盤格的座標, 方便計算所屬棋盤格id
            [x, y] = [x - dx, y - dy];
            //座標轉換為棋盤格id, 因當作陣列id用四捨五入防止TypeScript的浮點數誤差
            this.fitCells.push([Math.round(x / CELL_WIDTH + Math.floor((board.length - 1) / 2)), Math.round(y / CELL_WIDTH + Math.floor((board.length - 1) / 2))]);
        }
    }

    //拼圖放上棋盤事件處理完成的回傳
    onFitPuzzleCallback(_dy:number|null)
    {
        if(this.dragPuzzle && _dy != null){
            //判定成功調整為吸附後位置
            this.dragPuzzle.setPosition(this.fitPuzzlePos[0], this.fitPuzzlePos[1] - Math.round(_dy * CELL_WIDTH), 0);
            this.fitPuzzlePos = [0, 0];
        }
        this.dragPuzzle = null;
    }

    //HSL轉RGB公式
    hslToRgb(_h:number, _s:number, _l:number): [number, number, number]
    {
        let r:number, g:number, b:number;
        if (_s == 0){
            r = g = b = _l;
        }
        else{
            let hue2rgb = (_p:number, _q:number, _t:number) => {
                if (_t < 0) _t += 1;
                if (_t > 1) _t -= 1;
                if (_t < 1 / 6) return _p + (_q - _p) * 6 * _t;
                if (_t < 1 / 2) return _q;
                if (_t < 2 / 3) return _p + (_q - _p) * (2 / 3 - _t) * 6;
                return p;
            };
            let q = _l < 0.5 ? _l * (1 + _s) : _l + _s - _l * _s;
            let p = 2 * _l - q;
            r = hue2rgb(p, q, _h + 1 / 3);
            g = hue2rgb(p, q, _h);
            b = hue2rgb(p, q, _h - 1 / 3);
        }
        return [r * 255, g * 255, b * 255];
    }

    //生成_n個色相等差的顏色
    generateHueColors(_n:number): Color[]
    {
        let colors:Color[] = [];
        for (let i = 0; i < _n; i++) {
            let h = i / _n;
            let [r, g, b] = this.hslToRgb(h, this.cellSaturation, this.cellLightness);
            colors.push(new Color(r, g, b));
        }
        return colors;
    }

    private fitCells:number[][] = []; //拼圖重疊棋盤格id
    private fitPuzzlePos:number[] = [0, 0]; //拼圖重疊棋盤格棋盤座標(拼圖吸附後位置)
    private dragPuzzle:Node|null = null; //抓取中的拼圖
    private dragStartPos:Vec3 = new Vec3(); //抓取拼圖前游標位置(計算移動量)
    private puzzleStartPos:Vec3 = new Vec3(); //抓取拼圖前拼圖位置(計算移動量)
}


