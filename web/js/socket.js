socket.on("welcome", () => {
    console.log(socket.id); // "G5p5..."
});
socket.on("play", (item) => {
    play(item.x, item.y);
    showPan() 
})
