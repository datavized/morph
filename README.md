<p align="center"><a href="https://morph.graphics" target="_blank"><img width="80%" alt="morph-header" src="https://user-images.githubusercontent.com/492291/45934608-52b98d80-bf6e-11e8-8d1e-a4975a34a2c7.png"></a></p>

# Morph

Morph is an open-source web tool for creating designs, animations or interactive visualizations from data. Morph has been developed by [Datavized Technologies](https://datavized.com) with support from [Google News Initiative](https://newsinitiative.withgoogle.com).

## How does Morph work?

The tool involves five simple steps to create [generative art](https://en.wikipedia.org/wiki/Generative_art) from [tabular data](https://en.wikipedia.org/wiki/Table_(information)) (e.g. spreadsheets and comma-separated values).
1. Data: Upload your own data or select one of the sample spreadsheets (headers are required to detect fields, maximum file size is 2MB, up to 2,000 rows with 300 rows visible)
2. Review: Examine your data in the tabular preview
3. Design: Choose a chart type (Pie Chart, Bar Chart, Scatter Plot, Line Chart, Area Timeline, Radial Area) to prepare visualization
4. Organize: Choose different fields to build your chart or fill random
5. Evolve: Click your chart to evolve your tree, click again to generate new nodes or leaves, then select the Editor to modify and save your leaf. Export any visual, including your original, as a Still Image or Animation.

The data uploaded to Morph is processed fully in the web browser: no server-side operations or storage is performed. It is also optimized for mobile and designed as a cross-platform Progressive Web App so the tool can be installed on any web connected device.

## Who uses Morph?

Morph is built to be fast, fun and easy to use, but allows for output to industry-standard formats so that users can share their creations to social media or download them for use in professional design projects or presentations. The software uses a generative algorithm to create graphics based on data from a spreadsheet and the user designs by guiding the evolution of their artwork through simple taps or clicks. A progressive web app, it allows users to install the app to their device directly from the browser. Morph works on mobile, tablet and desktop, and aims to bring data and design capabilities to a wider audience. We welcome everyone who would like to contribute to improving the platform. There’s a lot of great tools available for serious data analysts and scientists. We wanted to make something creative for non-technical people who are often intimidated by data and design software. Morph works great in a classroom setting where beginners can make artworks in minutes, but also professional users like it for the randomness and speed it offers them for rapid-prototyping ideas.

## What is Morph’s goal?

Morph exists to engage users in the creative expression of data without having to code. Generative art based algorithms turn data into a visual representation and the user can affect how their data interacts with the final visual via the algorithm. The algorithms themselves are not fixed; the user can randomly mutate, evolve and generate new algorithms creating new visuals, encouraging the sense of creative exploration and discovery. Through an intuitive UI to change parameters, the user can change the algorithms without any code. The tool focuses on random creation rather than preset templates. Where data visualization tools like RawGraphs and Flourish allow the user to turn spreadsheet data into charts and graphs, Morph enables the user to iterate on visual chart types through random mutation and generation of algorithms that can be continuously evolved by the user. The tool is also designed for creative expression, discovery and error handling. There are no restrictions on the types of variables that are assigned as is the case with traditional chart visualization tools.

## How can your organization benefit from using Morph?

Organizations can benefit using Morph as a way to inspire a data-driven culture, use it as a data icebreaker, invite users from all departments and teams to play with Morph. Curate some of your organization’s data for users to get started and share what they make and celebrate it internally on Slack or digital dashboards, or share widely on social media and in your next presentation or event. Turn your annual report or customer data into generative art. This is a great tool for individuals and organizations without the resources to hire in-house developers or design teams. Data-driven art projects usually require a lot of money, people and time to produce but Morph now lets anyone create something great in minutes with free software, even if they only have a smartphone. The possibilities are endless. What will you make with Morph?

- Web App: https://app.morph.graphics
- Project official page: https://morph.graphics
- Documentation: https://github.com/datavized/morph/

## Usage

The easiest way to use Morph is by accessing the most updated version on the official app page at [morph.graphics](https://app.morph.graphics). However, Morph can also run locally on your machine: see the installation instructions below. Share your creations with the community [@FeedMorph on Twitter](https://twitter.com/FeedMorph).

## Developing

You can run your own build of Morph. You can make changes to customize for your own purposes, and contributions are welcome if you make any improvements or bug fixes.

### Requirements
- [git](https://git-scm.com/book/en/Getting-Started-Installing-Git)
- [node.js/npm](https://www.npmjs.com/get-npm)

### Installation

Clone the Morph git repository from the command line:
```sh
git clone https://github.com/datavized/morph.git
```

Navigate to the Morph repository directory
```sh
cd morph
```

Install dependencies
```sh
npm install
```
### Build

To run in development mode, which will run a local web server on port 9000 and automatically rebuild when any source code files are changed.
```sh
npm run start
```

To compile a production build
```sh
npm run build
```

## Built With
- [React](https://reactjs.org/)
- [Material UI](https://material-ui.com/)
- [PixiJS](http://www.pixijs.com/)

## Core Team
Morph is maintained by [Datavized Technologies](https://datavized.com) with support from [Google News Initiative](https://newsinitiative.withgoogle.com) and key collaborator [Alberto Cairo](http://www.thefunctionalart.com/).

If you want to know more about Morph, how it works and future developments, please visit the official website. For any specific request or comment we suggest you to use Github. You can also write to us at contact@datavized.com.

## Contributing

We welcome and appreciate contributions, in the form of code pull requests, bug reports, feature requests or additions to our gallery. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our [Code of Conduct](CODE_OF_CONDUCT.md) and submission process. By participating, you are expected to uphold this code. Please report unacceptable behavior to support@datavized.com.

## License

This software is licensed under the [MPL 2.0](LICENSE)
