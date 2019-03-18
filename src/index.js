import './css/styles.css';
import { modal } from "./js/modalHandler";

ymaps.ready(initMap);

let myMap,
    coords,
    myBalloons = [],
    objectBalloon = {},
    clickY, clickX,
    reviewsLayout,
    mapContainer = document.getElementById('map'),
    modalLayout = document.getElementById('modal'),
    feedbackList = document.getElementById('feedbacks-list'),
    modalAddress = document.getElementById('modal-address'),
    modalBtn = document.getElementById('btn'),
    closeBtn = document.getElementById('btn-close');


let getPointData = function (param, response) {
    return {
        balloonContentHeader: `<strong> ${param[0]}</strong>`,
        balloonContentBody: '<a data-review="true" data-coords="'
            + param[2] + ',' + param[3] + '" data-address="'
            + response.GeoObject.description + ' '
            + response.GeoObject.name + '" href="#">'
            + response.GeoObject.description + ' '
            + response.GeoObject.name + '</a>',
        balloonContentFooter: `<div><strong>${param[1]}</strong></div><div style="margin: 8% 0 0 38%;">${param[4]}</div>`
    };
};

function getPointOptions() {
    return {
        preset: 'islands#redStretchyIcon',
        hasBalloon: false
    };
}

function checkCoords(coords) {
    if ((typeof coords[0] === "string") && (typeof coords[1] === "string")) {
        let lat = coords[0],
            lng = coords[1];

        return [lat, lng]
    } else {
        let lat = coords[0].toPrecision(6),
            lng = coords[1].toPrecision(6);

        return [lat, lng]
    }
}

function getPointAddress(coords) {

    coords = checkCoords(coords);

    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest(),
            url = 'https://geocode-maps.yandex.ru/1.x/?format=json&kind=house&results=1&geocode='
                + coords[1] + ',' + coords[0];
        xhr.open('GET', url);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    let jsonResponse = JSON.parse(xhr.responseText);
                    if (jsonResponse.response.GeoObjectCollection.featureMember) {
                        resolve(jsonResponse.response.GeoObjectCollection.featureMember[0]);
                    }
                } else {
                    reject('Что-то пошло не так ...');
                }
            }
        };

        xhr.send(null);
    })
}

function createReview(item) {
    let templateFn = require('./templates/feedback-template.hbs');
    return templateFn({
        item: item
    });
}

function initMap() {
    myMap = new ymaps.Map("map", {
        center: [55.76, 37.64],
        zoom: 14,
        controls: []
    });

    let clusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: true,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 130,
        clusterBalloonPagerSize: 5,
        preset: 'islands#invertedRedClusterIcons'
    });

    clusterer.events.add('objectsaddtomap', function () {

        let geoObjectState = cluster.getObjectState(myGeoObjects[1]);
        if (geoObjectState.isShown) {

            if (geoObjectState.isClustered) {
                geoObjectState.cluster.state.set('activeObject', myGeoObjects[1]);
                geoObjectState.cluster.balloon.open();

            } else {
                myGeoObjects[1].balloon.open();
            }
        }
    });

    myMap.geoObjects.add(clusterer);

    mapContainer.addEventListener('click', function (e) {
        clickY = e.pageY;
        clickX = e.pageX;
    }, true);

    mapContainer.addEventListener('click', function (e) {
        if (e.target.dataset.review) {
            e.preventDefault();

            let reviewsOfCurrentAddress = [];

            modalLayout.style.display = 'none';

            myBalloons.forEach(function (item) {
                if (item.address === e.target.dataset.address) {
                    reviewsOfCurrentAddress.push(item);
                }
            });

            myMap.balloon.close();

            reviewsLayout = createReview(reviewsOfCurrentAddress);
            feedbackList.innerHTML = '';
            feedbackList.innerHTML += reviewsLayout;
            modalAddress.innerText = e.target.dataset.address;
            modalAddress.setAttribute('title', e.target.dataset.address);

            modalLayout.style.display = 'block';
            modalLayout.style.top = clickY + 'px';
            modalLayout.style.left = clickX + 'px';

            modalBtn.dataset.coords = e.target.dataset.coords;
            reviewsOfCurrentAddress = [];
        }
    });

    myMap.events.add('click', function (e) {
        if (!myMap.balloon.isOpen()) {
            coords = e.get('coords');
            modalLayout.style.display = 'none';
            coords = checkCoords(coords);

            modalBtn.dataset.coords = coords;

            myMap.balloon.close();
            getPointAddress(coords)
                .then(
                    function (response) {
                        let address = response.GeoObject.description + ' ' + response.GeoObject.name,
                            lastReviews = [];

                        myBalloons.forEach(function (item) {
                            if (item.address === address) {
                                lastReviews.push(item);
                            }
                        });

                        reviewsLayout = createReview(lastReviews);
                        feedbackList.innerHTML = '';
                        feedbackList.innerHTML += reviewsLayout;
                        modalAddress.innerText = address;
                        modalAddress.setAttribute('title', address);
                        modalLayout.style.display = 'block';
                        modalLayout.style.top = clickY + 'px';
                        modalLayout.style.left = clickX + 'px';
                        lastReviews = [];
                    }
                )
                .catch()
        } else {
            myMap.balloon.close();
        }
    });

    modalLayout.addEventListener('click', function (e) {
        let inputName = document.getElementById('inputName').value,
            inputPlace = document.getElementById('inputPlace').value,
            inputReview = document.getElementById('inputReview').value;

        if ((inputName && inputPlace && inputReview) === '') {
            return;
        }

        if (e.target.dataset.add) {
            e.preventDefault();

            if ((typeof coords[0] === "string") && (typeof coords[1] === "string")) {
                var lat = coords[0],
                    lng = coords[1];
            } else {
                var lat = coords[0].toPrecision(6),
                    lng = coords[1].toPrecision(6);
            }

            if (e.target.dataset.coords) {
                coords = e.target.dataset.coords.split(',');

                var lat = coords[0],
                    lng = coords[1];
            }

            getPointAddress(coords)
                .then(
                    function (response) {
                        let myPlacemark,
                            lastReviews = [],
                            address = response.GeoObject.description + ' ' + response.GeoObject.name;

                        objectBalloon.coords = [lat, lng];
                        objectBalloon.address = address;
                        objectBalloon.name = inputName;
                        objectBalloon.review = inputReview;
                        objectBalloon.place = inputPlace;
                        objectBalloon.date = new Date().toLocaleString();

                        myBalloons.push(objectBalloon);

                        myBalloons.forEach(function (item) {
                            if (item.address === address) {
                                lastReviews.push(item);
                            }
                        });

                        myPlacemark = new ymaps.Placemark(
                            [lat, lng],
                            getPointData([inputPlace, inputReview, lat, lng, objectBalloon.date], response),
                            getPointOptions()
                        );

                        myMap.geoObjects.add(myPlacemark);

                        reviewsLayout = createReview(lastReviews);
                        feedbackList.innerHTML = reviewsLayout;

                        objectBalloon = {};

                        clusterer.add(myPlacemark);

                        myPlacemark.events.add('click', function (e) {
                            let balloonCoords = e.get('target').geometry.getCoordinates(),
                                lastReviews = [];

                            myBalloons.forEach(function (item) {
                                if ((item.coords[0] === balloonCoords[0]) && (item.coords[1] === balloonCoords[1])) {
                                    lastReviews.push(item);
                                }
                            });

                            reviewsLayout = createReview(lastReviews);
                            feedbackList.innerHTML = '';
                            feedbackList.innerHTML += reviewsLayout;
                            modalAddress.innerText = address;
                            modalAddress.setAttribute('title', address);
                            modalBtn.dataset.coords = balloonCoords;
                            modalLayout.style.top = clickY + 'px';
                            modalLayout.style.left = clickX + 'px';
                            modalLayout.style.display = 'block';
                            lastReviews = [];
                        });
                    }
                )
                .catch(function () {
                    alert('Адрес не определен')
                });
        }
    });

    myMap.events.add('boundschange', () => {
        modalLayout.style.display = 'none';
    });

    myMap.events.add('actiontick', () => {
        modalLayout.style.display = 'none';
    });

    closeBtn.addEventListener('click', () => {
        modalLayout.style.display = 'none';
    })
}

modalBtn.onclick = () => {
    setTimeout(() => {
        document.getElementById('inputName').value = '';
        document.getElementById('inputPlace').value = '';
        document.getElementById('inputReview').value = '';
    }, 100)
};

modalLayout.addEventListener('click', () => {
    modal(modalLayout);
});
