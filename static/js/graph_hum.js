fetch("/api/")
  .then(res => res.json())
  .then(raw => {

    const data = raw.reverse();

    document.getElementById("exportCSV").onclick = () => exportCSV(data);

    const labels = data.map(d =>
      new Date(d.dt).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    );

    const fullDates = data.map(d =>
      new Date(d.dt).toLocaleString("fr-FR")
    );

    const values = data.map(d => d.hum);

    new Chart(document.getElementById("humChart"), {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Humidité (%)",
          data: values,
          borderColor: "#198754",
          backgroundColor: "rgba(25,135,84,0.18)",
          fill: {
            target: "start"
          },
          tension: 0.35,
          borderWidth: 2.5,

          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: "#198754",
          pointBorderColor: "#198754",

          animations: {
            backgroundColor: { duration: 0 }
          }
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        animations: {
          y: {
            from: ctx => ctx.chart.scales.y.getPixelForValue(
              ctx.chart.scales.y.min
            )
          }
        },

        animation: {
          duration: 1200,
          easing: "easeOutQuart"
        },

        plugins: {
          legend: {
            position: "bottom",
            labels: { usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              title: ctx => fullDates[ctx[0].dataIndex],
              label: ctx => ` ${ctx.parsed.y.toFixed(1)} %`
            }
          }
        },

        scales: {
          x: {
            ticks: {
              maxRotation: 60,
              minRotation: 60,
              font: { size: 10 }
            }
          },
          y: {
            suggestedMin: 0,
            suggestedMax: Math.max(...values) + 10,
            title: {
              display: true,
              text: "Humidité (%)"
            }
          }
        }
      }
    });
  });

function exportCSV(data) {
  let csv = "sep=;\nDate;Humidite (%)\n";

  data.forEach(d => {
    const date = "'" + new Date(d.dt).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    csv += `${date};${d.hum}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "historique_humidite.csv";
  a.click();

  URL.revokeObjectURL(url);
}
