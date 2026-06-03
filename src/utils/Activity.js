export const fetchWeatherAndCoordinates = async city => {
  try {
    const response = await fetch(
      `${baseURL}getWeatherAndCoordinates?city=${city}`,
    );
    const {coordinates, weather} = await response.json();

    if (coordinates) {
      // Update both food and activity with coordinates and weather
      setCurrentLedgerEntry(prev => ({
        ...prev,
        food: {
          ...prev.food,
          place: {
            ...prev.food.place,
            latitude: coordinates.lat,
            longitude: coordinates.lon,
          },
        },
        activity: {
          ...prev.activity,
          place: {
            ...prev.activity.place,
            latitude: coordinates.lat,
            longitude: coordinates.lon,
          },
        },
      }));

      if (weather) {
        setCurrentLedgerEntry(prev => ({
          ...prev,
          food: {...prev.food, weather},
          activity: {...prev.activity, weather},
        }));
      }
    }
  } catch (error) {
    console.error('Error fetching weather and coordinates:', error);
  }
};
