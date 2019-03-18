function initMap() {
    ymaps.ready(() => {
        var myMap = new ymaps.Map("map", {
            center: [55.76, 37.64],
            zoom: 13,
            controls: []
        });
    });
}

export {
    initMap
}