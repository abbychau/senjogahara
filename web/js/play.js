
function showPan() {
	var c = document.getElementById("weiqi");
	var cxt = c.getContext("2d");
	cxt.strokeStyle="black";
	
	// 清空，重新畫線等
	cxt.clearRect(0,0,600,600);
	cxt.fillStyle = "sandybrown";
	cxt.fillRect(0,0,600,600);
	grid(cxt);
	ninePoints(cxt);

	for (var i = 0; i < 19; i++) {
		for (var j = 0; j < 19; j++) {
			if (pan[i][j] === 1) { //black
				var rg = cxt.createRadialGradient((i+1)*30-3, (j+1)*30-3, 1, (i+1)*30-4, (j+1)*30-4, 11);
				rg.addColorStop(1, /*"black"*/"#202020");
				rg.addColorStop(0, "gray");
				cxt.beginPath();
				cxt.arc((i+1)*30, (j+1)*30,15,0,2*Math.PI,false);
				//cxt.fillStyle="black";
				cxt.fillStyle=rg;
				cxt.fill();
				
			}
			else if (pan[i][j] === 2) { //white
				var rg = cxt.createRadialGradient((i+1)*30-3, (j+1)*30-3, 1, (i+1)*30-4, (j+1)*30-4, 11);
				rg.addColorStop(1, /*"lightgray"*/"#e0e0e0");
				rg.addColorStop(0, "white");
				cxt.beginPath();
				cxt.arc((i+1)*30, (j+1)*30,15,0,2*Math.PI,false);
				//cxt.fillStyle="white";
				cxt.fillStyle=rg;
				cxt.fill();
			}
			else if (pan[i][j] === 7) { // fill color
				cxt.beginPath();
				cxt.arc((i+1)*30, (j+1)*30,15,0,2*Math.PI,false);
				cxt.fillStyle="red";
				cxt.fill();
			}
		}
	}
	// 顯示手數
	if (move_show_flag) {
		for (var m = 0; m < move_record.length-1; m++) { // 最新的一手由後面的紅色標記
			// 先判斷一下棋子還在不在棋盤上
			if (pan[move_record[m][0]][move_record[m][1]] === 0)
				continue;

			// 而且只應該畫最新的數字（打劫後，可能導致一個坐標上重複許多步數）
			var repeat_move_flag = false;
			for (var j = m+1; j < move_record.length; j++) {
				if (move_record[m][0] === move_record[j][0] &&
						move_record[m][1] === move_record[j][1]) {
					repeat_move_flag = true;
					break;
				}
			}
			if (repeat_move_flag)
				continue;

			// 這下可以放心繪製手數數字啦
			if (move_record[m][2] % 2 === 1) { //black
				cxt.fillStyle="white";
			} else {
				cxt.fillStyle="black";
			}
			cxt.font="bold 18px sans-serif";
			if (move_record[m][2] > 99) {
				cxt.font="bold 16px sans-serif";
			}
			cxt.font="bold 16px sans-serif";
			cxt.textAlign="center";
			var move_msg = move_record[m][2].toString();
			//cxt.fillText(move_msg, (i+1)*30, (j+1)*30+6);
			cxt.fillText(
				move_msg, 
				(move_record[m][0]+1)*30, 
				(move_record[m][1]+1)*30+6
			);
		}
	}
	// 特別顯示最新的一手
	if (move_record.length > 0) {
		cxt.fillStyle = "red";
		var newest_move = move_record.length-1;
		cxt.fillRect(
			(move_record[newest_move][0]+1)*30-5, 
			(move_record[newest_move][1]+1)*30-5, 
			10, 10
		);
	}
	blackDom.innerHTML = black_took;
	whiteDom.innerHTML = white_took;
}

function play(row, col) {
	if (!inRange(row,col)) {
		alert("index error...." + row + "," + col);
		return;
	}
	// 處理已有棋子在此
	if (pan[row][col] != 0) {
		//alert("此處已有棋子！");
		return;
	}

	var can_down = false; // 是否可落子

	if (!judge_four_direction(row, col, AIR)) { // 如果沒有氣，則檢查是否可以落子
		if (judge_four_direction(row, col, current_move_color)) { // 有同色棋子 , 沒有則處理劫爭

			make_shadow(); // 製作陰影

			flood_fill(row, col, current_move_color); // 填充陰影
			if (fill_block_have_air(row, col, current_move_color)) {
				can_down = true;
				var dead_body = new Array();
				can_eat(row, col, dead_body);
				clean_dead_body(dead_body);
			} else {
				var dead_body = new Array();
				var cret = can_eat(row, col, dead_body);
				clean_dead_body(dead_body);
				
				if (cret) {
					can_down = true;
				} else {
					alert("無氣，不能落子！！");
				}
			}
		} else {
			var dead_body = new Array();
			var cret = can_eat(row, col, dead_body);

			// 劫爭也應該在此處理，只在此處理？
			if (cret) {
				if (!is_jie(row, col, dead_body)) {
					clean_dead_body(dead_body);
					can_down = true;
				} else {
					alert("劫, 不能落子, 請至少隔一手棋！");
				}
			}
		}
	} else {
		can_down = true;
		var dead_body = new Array();
		can_eat(row, col, dead_body);
		clean_dead_body(dead_body);
	}

	if (can_down) {
		stone_down(row, col);
		move_record.push([row, col, move_count, dead_body, current_move_color]);
		socket.emit('data', {action: 'play', x: row, y: col, color: current_move_color});
		// socket.emit('play', {x:row, y:col, color:current_move_color});
	}
}

function pass(){
	socket.emit('data', {action: 'pass'});
	// change player
	current_move = current_move === BLACK ? WHITE : BLACK;
	// increase move count
	move_count++;
	// update move record
	move_record.push([-1, -1, move_count, [], current_move]);
}

function takeback(sendBack){
	if (move_record.length > 0) {
		//check if is pass
		if (move_record[move_record.length-1][0] === -1) {
			move_record.pop();
			move_count--;
			current_move = current_move === BLACK ? WHITE : BLACK;
			return;
		}
		var last_move = move_record.pop();
		console.log(last_move[3])
		//remove stone
		pan[last_move[0]][last_move[1]] = 0;

		//put back dead body
		for (var i = 0; i < last_move[3].length; i++) {
			pan[last_move[3][i][0]][last_move[3][i][1]] = last_move[4];
			if(last_move[4] == BLACK){
				black_took--;
			}else{
				white_took--;
			}
		}

		move_count--;
		current_move_color = last_move[4] === BLACK ? WHITE : BLACK;

	}
	if(sendBack){
		socket.emit('data', {action: 'takeback', x: last_move[0], y: last_move[1]});
		console.log('sending takeback');
	}
}


// TODO 劫爭處理的本質是防止全局同型，基於此，還是要處理連環劫之類的，再說吧
// 我先看看應氏圍棋規則，研究研究
function is_jie(row, col, dead_body) { //是否劫
	//只吃了一個？ 希望我對圍棋的理解沒錯，單劫都是只互吃一個。
	if (dead_body.length === 1) {
		for (var i = 0; i < jie.length; i++) {
			//若符合（有坐標，且move_count就是上一手）
			//注意此處比較的是死去的棋子，下面push的是本次落子的棋子
			if (	
				jie[i][0] === dead_body[0][0] && 
				jie[i][1] === dead_body[0][1] && 
				jie[i][2] === move_count
				)
			{
				return true;
			}
		}
		//加入記錄表
		jie.push([row, col, move_count+1]);
		return false;
	}
	return false;
}

// 能提吃嗎
function can_eat(row, col, dead_body) {
	var color = current_move_color;
	var ret = false;
	var anti_color = 2;
	if (color === 2)
		anti_color = 1;

	if (row+1 <= 18 && pan[row+1][col] === anti_color) {
		make_shadow();
		shadow[row][col] = color;
		flood_fill(row+1, col, anti_color);
		if (!anti_fill_block_have_air(anti_color)) {
			var rret = record_dead_body(dead_body);
			ret = ret || rret;
		}
	}
	if (row-1 >= 0 && pan[row-1][col] === anti_color) {
		make_shadow();
		shadow[row][col] = color;
		flood_fill(row-1, col, anti_color);
		if (!anti_fill_block_have_air(anti_color)) {
			var rret = record_dead_body(dead_body);
			ret = ret || rret;
		}
	}
	if (col+1 <= 18 && pan[row][col+1] === anti_color) {
		make_shadow();
		shadow[row][col] = color;
		flood_fill(row, col+1, anti_color);
		if (!anti_fill_block_have_air(anti_color)) {
			var rret = record_dead_body(dead_body);
			ret = ret || rret;
		}
	}
	if (col-1 >= 0 && pan[row][col-1] === anti_color) {
		make_shadow();
		shadow[row][col] = color;
		flood_fill(row, col-1, anti_color);
		if (!anti_fill_block_have_air(anti_color)) {
			var rret = record_dead_body(dead_body);
			ret = ret || rret;
		}
	}
	return ret;
}

function record_dead_body(db) {
	var ret = false;
	for (var row = 0; row < shadow.length; row++) {
		for (var col = 0; col < shadow[row].length; col++) {
			if (shadow[row][col] === 7) {
				db.push([row, col]);
				ret = true; // it's true have dead body
				//alert("DEAD: "+(row).toString()+","+col.toString());
			}
		}
	}
	return ret;
}


function clean_dead_body(db) {
	for (var i = 0; i < db.length; i++) {
		pan[db[i][0]][db[i][1]] = 0;
	}
	if(current_move_color === WHITE){
		white_took += db.length;
	}else{
		black_took += db.length;
	}
}

// 填充的區域周圍是否有空
function fill_block_have_air(row, col, color) {
	for (var i = 0; i < pan.length; i++) {
		for (var j = 0; j < pan[i].length; j++) {
			if (i !== row || j !== col) {
				if (shadow[i][j] === 7 && pan[i][j] !== color) {
					return true; // 此塊有空，可下
				}
			}
		}
	}
	//alert("fill block 無氣！！！");
	return false;
}

// 提吃判斷專用
function anti_fill_block_have_air(color) {
	for (var i = 0; i < pan.length; i++) {
		for (var j = 0; j < pan[i].length; j++) {
			if (shadow[i][j] === 7 && pan[i][j] !== color) {
				return true; // 活
			}
		}
	}
	return false;
}

// 將盤面做個影分身
function make_shadow() {
	for (var i = 0; i < pan.length; i++) {
		for (var j = 0; j < pan[i].length; j++) {
			shadow[i][j] = pan[i][j];
		}
	}
}

function shadow_to_pan() {
	for (var i = 0; i < pan.length; i++) {
		for (var j = 0; j < pan[i].length; j++) {
			pan[i][j] = shadow[i][j];
		}
	}
}

// 泛洪填充，只操作影分身
function flood_fill(row, col, color) {
	// color 為當前要填充的顏色
	if (!inRange(row, col)){return;}

	var anti_color = 2;
	if (color === 2)
		anti_color = 1;

	if (shadow[row][col] !== anti_color && shadow[row][col] !== 7) { // 非color顏色，且未被填充
		shadow[row][col] = 7; // 表示已被填充
		flood_fill(row+1, col, color);
		flood_fill(row-1, col, color);
		flood_fill(row, col+1, color);
		flood_fill(row, col-1, color);
	}
}

function inRange(row, col) {
	return row >= 0 && row <= 18 && col >= 0 && col <= 18;
}

function judge_four_direction(row, col, judge) {
	if (
		(inRange(row+1,col) && pan[row+1][col] === judge) ||
		(inRange(row-1,col) && pan[row-1][col] === judge) ||
		(inRange(row,col+1) && pan[row][col+1] === judge) ||
		(inRange(row,col-1) && pan[row][col-1] === judge)
	) {
		return true;
	}
	return false;
}

// 真正落子
function stone_down(row, col) {
	pan[row][col] = current_move_color;
	current_move_color = current_move_color === BLACK ? WHITE : BLACK;
	move_count ++;
}
