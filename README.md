# GDAC Disaster Data Integration App for DHIS2

## Overview

The **GDAC Disaster Data Integration App** seamlessly integrates real-time disaster alerts from the Global Disaster Alert and Coordination System (GDAC) with health facility data from your DHIS2 instance. This interactive application helps humanitarian organizations visualize, analyze, and respond effectively to disaster events and their impact on healthcare facilities.
<img width="1510" alt="image" src="https://github.com/user-attachments/assets/c6fbeaf0-cddf-47ab-bc5e-6dfbd94d18f0" />

## Key Features

- **Interactive Map Visualization**: View real-time disaster events alongside health facility locations.
- **AI-Powered Analysis**: Leverage OpenAI's GPT-4-turbo for in-depth disaster and health data analysis.
- **Custom Filters**: Refine data views by disaster type, severity, date range, and facility types.
- **Export Reports**: Easily export AI-generated analyses and disaster data directly into Word documents.
- **Dark Mode**: Enhanced visibility in low-light conditions.
<img width="1510" alt="image" src="https://github.com/user-attachments/assets/d5740352-d788-4fe6-acfa-31228f31eb95" />

## Getting Started

1. Clone this repository.
2. Configure the DHIS2 API URL and your OpenAI API Key in the application settings.
3. Set up the CORS Proxy URL (e.g., `https://corsproxy.io/?`) in the application settings to enable seamless data retrieval from GDAC. Alternative CORS proxies include:
   - `https://api.allorigins.win/raw?url=`
   - `https://api.codetabs.com/v1/proxy?quest=`
4. Launch the application to begin exploring and analyzing GDAC disaster data.

## Technologies Used

- **DHIS2 API**: Integrates organizational unit data directly from your DHIS2 instance.
- **GDAC RSS Feeds**: Pulls live disaster event data from the Global Disaster Alert and Coordination System.
- **Leaflet.js**: Provides robust, responsive mapping and visualization.
- **Materialize CSS**: Responsive UI and styling.
- **OpenAI API**: Enhances analytical insights using generative AI.
- **CORS Proxy**: Facilitates cross-origin resource sharing to bypass browser security restrictions (default: `https://corsproxy.io/?`).

## Installation

Clone this repository and open the `index.html` file in your browser:

```bash
git clone https://github.com/jmesplana/gdac-dhis2-integration.git
cd gdac-dhis2-integration
```

Configure settings as prompted upon application launch.

## Contribution Guidelines

We welcome contributions! Please:

- Fork the repository
- Create a new branch for your feature (`git checkout -b feature/your-feature`)
- Submit a pull request for review

## License

This project is licensed under the **Mozilla Public License 2.0**.

## Contact

For questions or contributions, contact the Digital Health Team:

- **Email**: [digital.health@ifrc.org](mailto:digital.health@ifrc.org)
