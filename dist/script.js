"use strict";
class Coin {
    constructor(id, symbol, name, market_cap_rank) {
        this.id = id;
        this.symbol = symbol;
        this.name = name;
        this.market_cap_rank = market_cap_rank;
    }
}
const trackedCoins = JSON.parse(localStorage.getItem('trackedCoins') ?? '[]');
const cardWrapper = $('.card-wrapper');
$(document).ready(async function () {
    $('.about-me').click(() => showSection('.about-me-section'));
    $('.home').click(() => showSection('.home-section'));
    $('.liveReports').click(() => showSection('.live-reports'));
    $('.navbar-toggler').click(() => $('.navbar-collapse').toggleClass('show'));
    const showLoading = () => $('.loading-widget').show();
    const hideLoading = () => $('.loading-widget').hide();
    const fetchData = async (timeStamp) => {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/list');
        const data = await response.json();
        localStorage.setItem('data', JSON.stringify(data));
        localStorage.setItem('ttl', timeStamp.toString());
        return data;
    };
    const getData = async () => {
        try {
            showLoading();
            const lastTimeUpdated = localStorage.getItem('ttl');
            const currentTime = new Date().getTime();
            if (lastTimeUpdated && currentTime - parseInt(lastTimeUpdated) > 3600) {
                return fetchData(currentTime);
            }
            return JSON.parse(localStorage.getItem('data')) || fetchData(currentTime);
        }
        catch (e) {
            console.error(e);
            alert(`An error occurred while fetching data. Please try again later or contact support. Error: ${e.message}`);
            throw e;
        }
        finally {
            hideLoading();
        }
    };
    function renderData(dataToShow) {
        const trackedCoinsFromStorage = JSON.parse(localStorage.getItem('trackedCoins') ?? '[]');
        $('#totalCoins').text(dataToShow.length);
        dataToShow.forEach((coin) => {
            const isChecked = trackedCoinsFromStorage.includes(coin.symbol) ? 'checked' : '';
            renderCard(coin, isChecked);
        });
    }
    function renderCard(coin, isChecked) {
        cardWrapper.append(`
        <div class="card" style="width: 18rem;">
        <div class="card-body" style="position: relative;">
        <div class="form-check form-switch">
        <input class="form-check-input track-switch" type="checkbox" id="toggleSwitch${coin.symbol}" aria-expanded="false" aria-controls="collapse${coin.id}"${isChecked}>
    </div>
            <h5 class="card-title">${coin.name}</h5>
            <p class="card-text symbol">${coin.symbol}</p>
            <p class="card-text id">${coin.id}</p>
            <a class="btn btn-primary moreInfo" data-toggle="collapse" data-target="#collapse${coin.id}" aria-expanded="false" aria-controls="collapse${coin.id}">More Info</a>
            <div class="collapse" id="collapse${coin.id}">
                <div class="card card-body">
                </div>
            </div>
            <!-- Toggle switch positioned at bottom right -->
            
            </div>
        </div>
    
        `);
    }
    const data = await getData();
    renderData(data);
    $(document).on('click', '.moreInfo', async function () {
        const card = $(this).closest('.card');
        const cardId = card.find('.id').text();
        const collapseDiv = card.find(`#collapse${cardId}`);
        if (collapseDiv.hasClass('show')) {
            collapseDiv.collapse('hide');
        }
        else {
            card.append(`
                <div class="text-center loading-widget">
                    <div class="spinner-border text-info" role="status"></div>
                    <span class="sr-only">Loading...</span>
                </div>
            `);
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/${cardId}`);
            const data = await response.json();
            collapseDiv.html(`
                <div class="collapse more-info show">
                    <div class="card card-body">
                        <img src="${data.image.thumb}" class="image-coin" alt="${data.name}" />
                        <p class="card-text">Current price in ILS ₪${data.market_data.current_price.ils}</p>
                        <p class="card-text">Current price in USD $${data.market_data.current_price.usd}</p>
                        <p class="card-text">Current price in EUR €${data.market_data.current_price.eur}</p>
                    </div>
                </div>
            `);
            collapseDiv.collapse('show');
        }
        card.find('.loading-widget').remove();
    });
    $(".search-btn").click(async function () {
        showLoading();
        const searchInput = $(".search-input").val()?.toString().toLowerCase() ?? '';
        const filteredData = data.filter((coin) => {
            return coin.name.toLowerCase().includes(searchInput) || coin.symbol.toLowerCase().includes(searchInput);
        });
        cardWrapper.empty();
        renderData(filteredData);
        hideLoading();
    });
});
function showSection(sectionClass) {
    $('section').hide();
    $(sectionClass).show();
}
