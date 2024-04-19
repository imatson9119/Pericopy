import { Chart } from 'chart.js';

export const accuracyChartConfig = {
  responsive: true,
  plugins: {
    legend: {
      labels: {
        generateLabels: function (chart: any) {
          // Get the default label list
          const original =
            Chart.overrides.pie.plugins.legend.labels.generateLabels;
          const labelsOriginal = original.call(this, chart);

          // Build an array of colors used in the datasets of the chart
          let datasetColors = chart.data.datasets.map(function (e: any) {
            return e.backgroundColor;
          });
          datasetColors = datasetColors.flat();

          // Modify the color and hide state of each label
          labelsOriginal.forEach((label: any) => {
            // There are twice as many labels as there are datasets. This converts the label index into the corresponding dataset index
            label.datasetIndex = label.index % 2;

            // The hidden state must match the dataset's hidden state
            label.hidden = !chart.isDatasetVisible(label.datasetIndex);

            // Change the color to match the dataset
            label.fillStyle = datasetColors[Math.floor(label.index / 2) + label.datasetIndex * 3];
          });

          return labelsOriginal;
        },
      },
      onClick: function (mouseEvent: any, legendItem: any, legend: any) {
        // toggle the visibility of the dataset from what it currently is
        legend.chart.getDatasetMeta(legendItem.datasetIndex).hidden =
          legend.chart.isDatasetVisible(legendItem.datasetIndex);
        legend.chart.update();
      },
    },
    tooltip: {
      callbacks: {
        label: function (context: any) {
          return ' ' + context.formattedValue + '%';
        },
        title: function (context: any) {
          const labelIndex = context[0].datasetIndex + context[0].dataIndex * 2;
		      return context[0].chart.legend.legendItems[labelIndex].text;
        },
      },
    },
  },
};
