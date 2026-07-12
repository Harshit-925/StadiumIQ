"""StadiumIQ Domain Engine — FIFA World Cup 2026 venues."""

from typing import Any

VENUES: dict[str, dict[str, Any]] = {
    "metlife": {
        "name": "MetLife Stadium",
        "city": "New York/NJ",
        "country": "USA",
        "capacity": 82500,
        "exit_width_m": 45.0,

        "wheelchair_seats": 900,
    },
    "att": {
        "name": "AT&T Stadium",
        "city": "Dallas",
        "country": "USA",
        "capacity": 94000,
        "exit_width_m": 50.0,

        "wheelchair_seats": 1000,
    },
    "sofi": {
        "name": "SoFi Stadium",
        "city": "Los Angeles",
        "country": "USA",
        "capacity": 70000,
        "exit_width_m": 40.0,

        "wheelchair_seats": 750,
    },
    "hardrock": {
        "name": "Hard Rock Stadium",
        "city": "Miami",
        "country": "USA",
        "capacity": 65000,
        "exit_width_m": 38.0,

        "wheelchair_seats": 700,
    },
    "mercedes": {
        "name": "Mercedes-Benz Stadium",
        "city": "Atlanta",
        "country": "USA",
        "capacity": 75000,
        "exit_width_m": 42.0,

        "wheelchair_seats": 800,
    },
    "nrg": {
        "name": "NRG Stadium",
        "city": "Houston",
        "country": "USA",
        "capacity": 72000,
        "exit_width_m": 40.0,

        "wheelchair_seats": 770,
    },
    "arrowhead": {
        "name": "Arrowhead Stadium",
        "city": "Kansas City",
        "country": "USA",
        "capacity": 73000,
        "exit_width_m": 41.0,

        "wheelchair_seats": 780,
    },
    "levis": {
        "name": "Levi's Stadium",
        "city": "San Francisco",
        "country": "USA",
        "capacity": 71000,
        "exit_width_m": 40.0,

        "wheelchair_seats": 760,
    },
    "lincoln": {
        "name": "Lincoln Financial Field",
        "city": "Philadelphia",
        "country": "USA",
        "capacity": 69000,
        "exit_width_m": 39.0,

        "wheelchair_seats": 740,
    },
    "lumen": {
        "name": "Lumen Field",
        "city": "Seattle",
        "country": "USA",
        "capacity": 69000,
        "exit_width_m": 39.0,

        "wheelchair_seats": 740,
    },
    "gillette": {
        "name": "Gillette Stadium",
        "city": "Boston",
        "country": "USA",
        "capacity": 65000,
        "exit_width_m": 38.0,

        "wheelchair_seats": 700,
    },
    "azteca": {
        "name": "Estadio Azteca",
        "city": "Mexico City",
        "country": "Mexico",
        "capacity": 83000,
        "exit_width_m": 44.0,

        "wheelchair_seats": 850,
    },
    "bbva": {
        "name": "Estadio BBVA",
        "city": "Monterrey",
        "country": "Mexico",
        "capacity": 53500,
        "exit_width_m": 32.0,

        "wheelchair_seats": 550,
    },
    "akron": {
        "name": "Estadio Akron",
        "city": "Guadalajara",
        "country": "Mexico",
        "capacity": 48000,
        "exit_width_m": 28.0,

        "wheelchair_seats": 500,
    },
    "bcplace": {
        "name": "BC Place",
        "city": "Vancouver",
        "country": "Canada",
        "capacity": 54000,
        "exit_width_m": 33.0,

        "wheelchair_seats": 560,
    },
    "bmo": {
        "name": "BMO Field",
        "city": "Toronto",
        "country": "Canada",
        "capacity": 45000,
        "exit_width_m": 26.0,

        "wheelchair_seats": 480,
    },
}
