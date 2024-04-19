import 'chartjs-adapter-luxon';



export const timelineConfig: any = {
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
    tooltip: {
      callbacks: {
        label: function (context: any) {
          return context.dataset.label + ': ' + context.parsed.y + '%';
        },
      },
    },
  },
  scales: {
    "y": {
      id: "y",
      axis: "y",
      title: {
        display: true,
        text: 'Percentage',
      },
      startAtZero: true,
      min: 0,
      max: 100,
      
    },
    "x": {
      time: {
        displayFormats: false,
      },
      type: 'time',
      axis: "x",
      title: {
        display: true,
        text: 'Date',
      },
    },
    
  },
};
