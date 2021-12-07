
var move_show_flag = false;

addLoadEvent(function () {
	var move_show_button = document.getElementById("move_show");	
	if (move_show_button) {
		move_show_button.onclick = function() {
			if (move_show_flag) {
				move_show_button.innerHTML="顯示手數";
				move_show_flag = false;
			} else {
				move_show_button.innerHTML="取消顯示手數";
				move_show_flag = true;
			}
			showPan();
		}
	}
});

addLoadEvent(function(){
	document.getElementById("pass").onclick = function() {
		alert("X1")
	}
	document.getElementById("retreat").onclick = function() {
		alert("X2")
	}
});
