import fetch from 'node-fetch';

let lastUpdate = 0;
const api = (time: number) =>
  `http://www.ttss.krakow.pl/internetservice/geoserviceDispatcher/services/vehicleinfo/vehicles?positionType=CORRECTED&colorType=ROUTE_BASED&lastUpdate=${time}`;

const process = (data: any) =>
  data.vehicles
    .filter((vehicle: any) => !vehicle.isDeleted)
    .map((vehicle: any) => {
      const { id, name, longitude, latitude } = vehicle;
      const match = name.match(/(?<=\d+\s).*/);
      const direction = match !== null ? match[0] : name;
      let line = name.split(' ')[0];

      if (isNaN(parseFloat(line))) {
        line = direction
          .split(' ')
          .map((w: string) => w.charAt(0))
          .join('');
      }

      return {
        id,
        line,
        direction,
        long: longitude / 3600000,
        lat: latitude / 3600000,
      };
    });

export const fetchData = async (time?: number) => {
  const url = api(time !== undefined ? time : lastUpdate);
  const data = await fetch(url);
  const json = await data.json();
  const vehicles = process(json);
  return vehicles;
};
