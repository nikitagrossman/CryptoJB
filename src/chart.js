document.addEventListener('DOMContentLoaded', async () => {
  let coinsToShow = JSON.parse(localStorage.getItem('trackedCoins') ?? '[]');
  let chart;

  const createOrUpdateChart = async () => {
    if (chart) {
      chart.destroy();
    }

    const ctx = document.getElementById('myChart').getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    await updateChart();
    chart.update();
  };

  const updateChart = async () => {
    const getData = await fetch(
      `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinsToShow.join(
        ','
      )}&tsyms=USD`
    );
    const dataObj = await getData.json();
    if (Object.keys(dataObj).length === 0 || dataObj.Response === 'Error') {
      $('.noCoins').show();
      $('#myChart').hide();
      return;
    } else {
      $('.noCoins').hide();
      $('#myChart').show();
      updateTimeLabels();
      Object.entries(dataObj).forEach(([symbol, value]) => {
        addData(symbol, value.USD);
      });
    }
  };

  const updateTimeLabels = () => {
    const timeString = getCurrentTimeString();
    chart.data.labels.push(timeString);
    if (chart.data.labels.length > 20) {
      chart.data.labels.shift();
    }
  };

  const getCurrentTimeString = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };

  const addData = (label, newData) => {
    let dataset = chart.data.datasets.find(
      (dataset) => dataset.label === label
    );

    if (!dataset) {
      const randomColor = `rgba(${Math.floor(
        Math.random() * 256
      )}, ${Math.floor(Math.random() * 256)}, ${Math.floor(
        Math.random() * 256
      )}, 1)`;
      dataset = {
        label: label,
        data: [],
        borderColor: randomColor,
      };
      chart.data.datasets.push(dataset);
    }

    dataset.data.push(newData);
  };

  const handleChartUpdate = async () => {
    await updateChart();
    chart.update();
  };

  const handleTrackSwitchChange = async () => {
    chart.data.labels = [];
    const coinSymbolWasChosen = $(this).closest('.card').find('.symbol').text();
    let trackedCoinsFromStorage = JSON.parse(
      localStorage.getItem('trackedCoins') ?? '[]'
    );

    if ($(this).is(':checked')) {
      if (
        trackedCoinsFromStorage.length < 5 &&
        !trackedCoinsFromStorage.includes(coinSymbolWasChosen)
      ) {
        trackedCoinsFromStorage.push(coinSymbolWasChosen);
        localStorage.setItem(
          'trackedCoins',
          JSON.stringify(trackedCoinsFromStorage)
        );
      } else {
        $('.modal').modal('show');
        $('.modal-body').empty();
        trackedCoinsFromStorage.forEach((coinId) => {
          $('.modal-body').append(`
            <p>${coinId}</p>
            <button class="btn btn-danger remove-coin" data-coin-id="${coinId}">Remove</button>
          `);
        });
        coinToSwitch = [coinSymbolWasChosen];
        $(this).trigger('click');
      }
    } else {
      const index = trackedCoinsFromStorage.indexOf(coinSymbolWasChosen);
      if (index > -1) {
        trackedCoinsFromStorage.splice(index, 1);
        localStorage.setItem(
          'trackedCoins',
          JSON.stringify(trackedCoinsFromStorage)
        );
        chart.data.datasets.splice(index, 1);
      }
    }
    coinsToShow = trackedCoinsFromStorage;
    await handleChartUpdate();
    console.log(coinToSwitch);
  };

  const handleRemoveCoinClick = async () => {
    const coinIdToRemove = $(this).data('coin-id');
    let trackedCoinsFromStorage = JSON.parse(
      localStorage.getItem('trackedCoins') ?? '[]'
    );
    const coinToAdd = coinToSwitch[0];
    $(`#toggleSwitch${coinIdToRemove}`).trigger('click');
    $(`#toggleSwitch${coinToAdd}`).trigger('click');
    coinToSwitch = [];
    coinsToShow = trackedCoinsFromStorage;
    await handleChartUpdate();
    $('.modal').modal('hide');
  };

  await createOrUpdateChart();
  setInterval(handleChartUpdate, 2000);

  $(document).on('change', '.track-switch', handleTrackSwitchChange);
  $(document).on('click', '.remove-coin', handleRemoveCoinClick);
});
