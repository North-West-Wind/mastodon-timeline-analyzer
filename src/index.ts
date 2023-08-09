import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import generator, { Entity } from 'megalodon';
import fetch from "node-fetch";

const client = generator('mastodon', process.env.BASE_URL!, process.env.TOKEN);

const list = Array(24).fill(0);
//const list = JSON.parse(readFileSync("data.json", { encoding: "utf8" }));
const minDate = new Date(2023, 5, 1);
const today = new Date();

(async () => {
	var data: Entity.Status[] = [];
	do {
		const options: { limit: number, max_id?: string } = { limit: 40 };
		if (data.length) {
			console.log("last datum created at", data[data.length - 1].created_at);
			options.max_id = data[data.length - 1].id;
		}
		const res = await client.getLocalTimeline(options);
		data = res.data;
		for (const datum of data) {
			const date = new Date(datum.created_at);
			if (date.getTime() < today.getTime()) continue;
			list[date.getHours()] += 1;
		}
		console.log("recorded", data.length);
		writeFileSync("data.json", JSON.stringify(list, null, 2));
	} while (new Date(data[data.length - 1].created_at).getTime() > minDate.getTime());

	const chartData = {
		type: "bar",
		data: {
			labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
			datasets: [{
				label: "Posts",
				data: list
			}]
		}
	};
	const res = await fetch("https://quickchart.io/chart?c=" + JSON.stringify(chartData));
	writeFileSync("chart.png", Buffer.from(await res.arrayBuffer()));
})();