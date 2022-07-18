var body = document.querySelector('body');
var imageTag = document.querySelector("img");

$(document).ready(function () {
    var searchHistory = [];

    // Today's date
    const momentDay = moment().format('dddd, MMMM Do');
    $('.todayDate').prepend(momentDay);

    // Generate dates for the 5-day forecast
    for (var i = 1; i < 6; i++) {
        $(`#${i}Date`).text(moment().add(i, 'd').format('dddd, MMMM Do'));
    }
    //----------------------------------------------------------
    // Event listeners
    //----------------------------------------------------------
    // Submit event on search form
    $('form').on('submit', function (event) {
        event.preventDefault();
        // Collects the value from the search field
        let city = $('input').val();
        // Returns if input is empty
        if (city === '') {
            return;
        }

        // Runs the function to call the API and display retrieved data
        call();

        // Clears and resets the form
        $('form')[0].reset();
    });

    // Click event for search history buttons
    $('.searchHistoryEl').on('click', '.historyBtn', function (event) {
        event.preventDefault();
        // Collects the value from the button text
        let btnCityName = $(this).text();
        // Runs the function to call the API and display retrieved data
        call(btnCityName);
    });

    $('#clearBtn').on('click', function (event) {
        event.preventDefault();
        // Clears local storage
        window.localStorage.clear();
        // Clears the search history element
        $('.searchHistoryEl').empty();
        searchHistory = [];
        renderButtons();
        // Clears and resets the form
        $('form')[0].reset();
    });

    //---------------
    // Creates and displays buttons for each city that is searched. Persists on refresh.
    //---------------
    const renderButtons = () => {
        // Clears the search history div
        $('.searchHistoryEl').html('');
        // For each item in the search history array
        for (var j = 0; j < searchHistory.length; j++) {
            // Store the search term (city) and create a button with the search term displayed
            let cityName1 = searchHistory[j];
            let historyBtn = $(
                '<button type="button" class="btn btn-primary btn-lg btn-block historyBtn">'
            ).text(cityName1);
            // Prepend the buttons to the search history div
            $('.searchHistoryEl').prepend(historyBtn);
        }
    };
    //-------------
    // Pulls localStorage into searchHistory array
    //-------------
    const init = () => {
        // Get stored cities from localStorage
        // Parsing the JSON string to an object
        let storedCities = JSON.parse(localStorage.getItem('searchHistory'));
        // If cities were retrieved from localStorage, update the search history array
        if (storedCities !== null) {
            searchHistory = storedCities;
        }
        // Render buttons to the DOM
        renderButtons();
    };

    init();
    //---------------
    // Add content of search to local storage on submit
    //---------------
    const storeCities = () =>
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));

    //---------------
    // API call for UV Index. Gets the lat/lon from current weather call
    //---------------
    const uvCall = (lon, lat) => {
        let uvQueryURL = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&units=imperial&appid=f54b87d9a2a2e6e06dcaf6e5495b8626`;

        $.ajax({
            url: uvQueryURL,
            method: 'GET',
        }).then(function (uvResponse) {
            // Display UV Index data
            $('#uvData').html(`${uvResponse.value}`);
            // Color code the UV Index row
            if (uvResponse.value <= 2) {
                $('.uvRow').css('background-color', 'green');
            } else if (uvResponse.value > 2 && uvResponse.value <= 5) {
                $('.uvRow').css('background-color', 'yellow');
            } else if (uvResponse.value > 5 && uvResponse.value <= 7) {
                $('.uvRow').css('background-color', 'orange');
            } else if (uvResponse.value > 7 && uvResponse.value <= 10) {
                $('.uvRow').css('background-color', 'red');
            } else {
                $('.uvRow').css('background-color', 'violet');
            }
        });
    };

    //---------------
    // API call for five-day forecast. Gets the lat/lon from current weather call
    //---------------
    const fiveDay = (lon, lat) => {
        let fiveQueryURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&units=imperial&appid=77cb488591d883bec900753d1136d81c`;

        $.ajax({
            url: fiveQueryURL,
            method: 'GET',
        }).then(function (fiveResponse) {
            // Loops through the forecast starting tomorrow
            for (var k = 1; k < 6; k++) {
                // Displays the image in the appropriate card
                $(`#${k}img`).attr(
                    'src',
                    `http://openweathermap.org/img/wn/${fiveResponse.daily[k].weather[0].icon}@2x.png`
                );
                // Displays the temp in the appropriate card
                $(`#${k}temp`).html(
                    `Temp: ${fiveResponse.daily[k].temp.day} &#8457;`
                );
                // Displays the humidity in the appropriate card
                $(`#${k}humid`).html(
                    `Humidity: ${fiveResponse.daily[k].humidity}%`
                );
            }
        });
    };

    // --------------------------------
    // ajax call to openweathermap API
    //---------------------------------
    // Called with input from search bar or search history button
    const call = (btnCityName) => {
        let cityName = btnCityName || $('input').val();
        // Current weather conditions
        let queryURL = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=imperial&appid=77cb488591d883bec900753d1136d81c`;
        // ajax call
        $.ajax({
            url: queryURL,
            method: 'GET',
        })
            .then(function (response) {
                if (!btnCityName) {
                    // Adds the searched city to the search history array
                    searchHistory.unshift(cityName);
                    // Runs function to store the search history array in local storage
                    storeCities();
                    // Runs function to create and display buttons of prior searched cities
                    renderButtons();
                }
                // Collect lon and lat for subsequent API calls
                var lon = response.coord.lon;
                var lat = response.coord.lat;
                // Lists the data in the Jumbotron
                $('#cityName').text(response.name);
                $('#currentImg').attr(
                    'src',
                    `http://openweathermap.org/img/wn/${response.weather[0].icon}@2x.png`
                );
                $('#tempData').html(`${response.main.temp} &#8457;`);
                $('#humidData').html(`${response.main.humidity}%`);
                $('#windData').html(`${response.wind.speed} mph`);
                $('#windArrow').css({
                    transform: `rotate(${response.wind.deg}deg)`,
                });
                // Calls the API for uv index data
                uvCall(lon, lat);
                // Calls the API for five-day forecast info
                fiveDay(lon, lat);
            })
            // If an error is returned
            .catch(function (error) {
                // Throws an alert if invalid city
                alert('Enter a valid city');
            });
    };

    call(searchHistory[0]);

    
    //Change textarea background color based on time
    var checkTime = function () {
        

        //Get Current time
        var currentTime = moment().format('HH');
        console.log(currentTime);


            //remove any old classes from element
            $(body).removeClass("morning afternoon night image");
            imageTag.remove()



            var tod = "";
            if (currentTime == 6 || currentTime == 7 ||  currentTime == 8 ||  currentTime == 9 || currentTime == 10 || currentTime == 11) {
                tod = "morning";
            }   
            else if (currentTime == 12 || currentTime == 13 || currentTime == 14 || currentTime == 15 || currentTime == 16 ) {
                tod = "afternoon";
            }  
            else {
                tod = "night";
            }

            if (tod === "morning") {
                $(body).addClass("morning");
               /*  const morning = () => {
                    let urlMorn = `https://api.giphy.com/v1/gifs/search?api_key=kB2ayeNVEICw2y4UnbixQwY4qwpa4FMr&limit=1&q=morning`;
                    console.log(urlMorn);
                    fetch(urlMorn)
                    .then(response => response.json())
                    .then(json => {
                      json.data
                        .map(gif => gif.images.fixed_height.url)
                        .forEach(morning => {
                          let img = document.createElement('img')
                          img.src = morning
                          document.body.appendChild(img)

                        })
                    })
                    .catch(error => document.body.appendChild = error)
            
                } 
                morning(); */
            
            
            } else if (tod === "afternoon") {
                $(body).addClass("afternoon");
               /*  const afternoon = () => {
                    let urlArvo = `https://api.giphy.com/v1/gifs/search?api_key=kB2ayeNVEICw2y4UnbixQwY4qwpa4FMr&limit=1&q=afternoon`;
                    console.log(urlArvo);
                    fetch(urlArvo)
                    .then(response => response.json())
                    .then(json => {
                      json.data
                        .map(gif => gif.images.fixed_height.url)
                        .forEach(afternoon => {
                          let img = document.createElement('img')
                          img.src = afternoon
        
                          console.log(afternoon)
                          document.body.appendChild(img)
                          console.log(img);


        
                        })
                    })
                    .catch(error => document.body.appendChild = error)
        
                }
                afternoon(); */
            } else {
                $(body).addClass("night");
                    /* const night = () => {
                    let urlNight = `https://api.giphy.com/v1/gifs/search?api_key=kB2ayeNVEICw2y4UnbixQwY4qwpa4FMr&limit=1&q=night`;
                    console.log(urlNight);
                    fetch(urlNight)
                    .then(response => response.json())
                    .then(json => {
                      json.data
                        .map(gif => gif.images.fixed_height.url)
                        .forEach(night => {
                          let img = document.createElement('img')
                          img.src = night
                          document.body.appendChild(img)

                        })
                    })
                    .catch(error => document.body.appendChild = error)
                        }; 
                        night(); */
        
            }   
        
    }
       

    
        checkTime();
        //per hour
        setInterval(checkTime, 600000);
    }


);  




