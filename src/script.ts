class Coin {
  id: string;
  symbol: string;
  name: string;
  market_cap_rank: number;

  constructor(
    id: string,
    symbol: string,
    name: string,
    market_cap_rank: number
  ) {
    this.id = id;
    this.symbol = symbol;
    this.name = name;
    this.market_cap_rank = market_cap_rank;
  }
}

const trackedCoins: string[] = JSON.parse(
  localStorage.getItem('trackedCoins') ?? '[]'
);
const cardWrapper = $('.card-wrapper');
const totalCoinsElement = $('#totalCoins');

const showLoading = () => $('.loading-widget').show();
const hideLoading = () => $('.loading-widget').hide();

const isCacheExpired = (
  lastTimeUpdated: string | null,
  expiryTime: number = 3600
): boolean => {
  if (!lastTimeUpdated) return true;
  const currentTime: number = new Date().getTime();
  return currentTime - parseInt(lastTimeUpdated) > expiryTime * 1000;
};

const fetchData = async (timeStamp: number): Promise<Coin[]> => {
  const response: Response = await fetch(
    'https://api.coingecko.com/api/v3/coins/list'
  );
  const data: Coin[] = await response.json();
  localStorage.setItem('data', JSON.stringify(data));
  localStorage.setItem('ttl', timeStamp.toString());
  return data;
};

const getData = async (): Promise<Coin[]> => {
  showLoading();
  try {
    const lastTimeUpdated: string | null = localStorage.getItem('ttl');
    if (isCacheExpired(lastTimeUpdated)) {
      return fetchData(new Date().getTime());
    }
    return (
      JSON.parse(localStorage.getItem('data')!) ||
      fetchData(new Date().getTime())
    );
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error(e.message);
      alert(`An error occurred: ${e.message}`);
    } else {
      console.error('An unexpected error occurred.');
    }
    return [];
  } finally {
    hideLoading();
  }
};

function renderData(dataToShow: Coin[]) {
  const trackedCoinsFromStorage: string[] = JSON.parse(
    localStorage.getItem('trackedCoins') ?? '[]'
  );
  totalCoinsElement.text(dataToShow.length);
  dataToShow.forEach((coin: Coin) => {
    const isChecked = trackedCoinsFromStorage.includes(coin.symbol);
    renderCard(coin, isChecked);
  });
}

function renderCard(coin: Coin, isChecked: boolean) {
  const checkedAttribute = isChecked ? 'checked' : '';
  cardWrapper.append(createCardElement(coin, checkedAttribute));
}

function createCardElement(coin: Coin, checkedAttribute: string): string {
  return `
    <div class="card" style="width: 18rem;">
      <div class="card-body" style="position: relative;">
        <div class="form-check form-switch">
          <input class="form-check-input track-switch" type="checkbox" id="toggleSwitch${coin.symbol}" aria-expanded="false" aria-controls="collapse${coin.id}" ${checkedAttribute}>
        </div>
        <h5 class="card-title">${coin.name}</h5>
        <p class="card-text symbol">${coin.symbol}</p>
        <p class="card-text id">${coin.id}</p>
        <a class="btn btn-primary moreInfo" data-id="${coin.id}" data-toggle="collapse" data-target="#collapse${coin.id}" aria-expanded="false" aria-controls="collapse${coin.id}">More Info</a>
        <div class="collapse" id="collapse${coin.id}">
          <div class="card card-body"></div>
        </div>
      </div>
    </div>
  `;
}

$(document).ready(async function () {
  $('.about-me').click(() => showSection('.about-me-section'));
  $('.home').click(() => showSection('.home-section'));
  $('.liveReports').click(() => showSection('.live-reports'));
  $('.navbar-toggler').click(() => $('.navbar-collapse').toggleClass('show'));

  const data = await getData();
  renderData(data);

  $(document).on('click', '.moreInfo', async function () {
    const coinId = $(this).data('id');
    const collapseDiv = $(`#collapse${coinId}`);

    if (collapseDiv.hasClass('show')) {
      hideCollapse(collapseDiv);
    } else {
      await fetchAndShowCoinDetails(coinId, collapseDiv);
    }
  });

  $('.search-btn').click(async function () {
    showLoading();
    const searchInput =
      $('.search-input').val()?.toString().toLowerCase() ?? '';
    const filteredData = data.filter((coin: Coin) => {
      return (
        coin.name.toLowerCase().includes(searchInput) ||
        coin.symbol.toLowerCase().includes(searchInput)
      );
    });
    cardWrapper.empty();
    renderData(filteredData);
    hideLoading();
  });
});

function showSection(sectionClass: string) {
  $('section').hide();
  $(sectionClass).show();
}

function hideCollapse(collapseDiv: JQuery<HTMLElement>) {
  collapseDiv.collapse('hide');
}

async function fetchAndShowCoinDetails(
  coinId: string,
  collapseDiv: JQuery<HTMLElement>
) {
  showLoadingWidget(collapseDiv);
  try {
    const data = await fetchCoinData(coinId);
    displayCoinDetails(data, collapseDiv);
  } catch (error) {
    console.error('Error fetching coin details:', error);
  } finally {
    hideLoadingWidget(collapseDiv);
  }
}

async function fetchCoinData(coinId: string): Promise<any> {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}`
  );
  return response.json();
}

function displayCoinDetails(data: any, collapseDiv: JQuery<HTMLElement>) {
  const content = `
    <div class="collapse more-info show">
      <div class="card card-body">
        <img src="${data.image.thumb}" class="image-coin" alt="${data.name}" />
        <p class="card-text">Current price in ILS ₪${data.market_data.current_price.ils}</p>
        <p class="card-text">Current price in USD $${data.market_data.current_price.usd}</p>
        <p class="card-text">Current price in EUR €${data.market_data.current_price.eur}</p>
      </div>
    </div>
  `;
  collapseDiv.html(content).collapse('show');
}

function showLoadingWidget(collapseDiv: JQuery<HTMLElement>) {
  collapseDiv.append(`
    <div class="text-center loading-widget">
      <div class="spinner-border text-info" role="status"></div>
      <span class="sr-only">Loading...</span>
    </div>
  `);
}

function hideLoadingWidget(collapseDiv: JQuery<HTMLElement>) {
  collapseDiv.find('.loading-widget').remove();
}
