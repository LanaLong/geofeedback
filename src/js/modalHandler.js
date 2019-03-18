export function modal(target) {
    target.onmousedown = e => {
        let { left, top } = target.getBoundingClientRect();
        let offsetLeft = e.pageX - left;
        let offsetTop = e.pageY - top;

        document.onmousemove = e => { move(e); };

        function move(e) {
            target.style.left = `${e.pageX - offsetLeft}px`;
            target.style.top = `${e.pageY - offsetTop}px`;
        }

        target.onmouseup = () => {
            target.onmouseup = null;
            document.onmousemove = null;
        };
    };
}