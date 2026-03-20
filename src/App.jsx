import { useMemo } from "react";
import { useStore } from "./useStore";
import { calculateDebtPlan } from "./data";
import Header from "./components/Header";
import MetricCards from "./components/MetricCards";
import ProgressBar from "./components/ProgressBar";
import MonthTabs from "./components/MonthTabs";
import BenchmarkTable from "./components/BenchmarkTable";
import Chart from "./components/Chart";
import YearTable from "./components/YearTable";
import DecisionRules from "./components/DecisionRules";
import SaveToast from "./components/SaveToast";

export default function App() {
  const store = useStore();
  const debtPlan = useMemo(() => calculateDebtPlan(store.actuals), [store.actuals]);

  return (
    <div className="wrap">
      <Header
        onUndo={store.undo}
        onRedo={store.redo}
        canUndo={store.canUndo}
        canRedo={store.canRedo}
      />
      <MetricCards month={store.selectedMonth} debtPlan={debtPlan} />
      <ProgressBar month={store.selectedMonth} debtPlan={debtPlan} onSelectMonth={store.selectMonth} />
      <MonthTabs month={store.selectedMonth} actuals={store.actuals} onSelectMonth={store.selectMonth} />
      <BenchmarkTable
        month={store.selectedMonth}
        actuals={store.actuals}
        notes={store.notes}
        debtPlan={debtPlan}
        onUpdateActual={store.updateActual}
        onUpdateNote={store.updateNote}
      />
      <Chart month={store.selectedMonth} actuals={store.actuals} debtPlan={debtPlan} />
      <YearTable month={store.selectedMonth} actuals={store.actuals} debtPlan={debtPlan} onSelectMonth={store.selectMonth} />
      <DecisionRules />

      <div style={{ textAlign: "center", padding: "20px 0", fontSize: 10, color: "var(--t5)" }}>
        Sweetchew Plan B Benchmark v2.0 — React Edition | ข้อมูลบันทึกอัตโนมัติใน browser นี้
        {store.lastSaved && (
          <><br />บันทึกล่าสุด: {new Date(store.lastSaved).toLocaleString("th-TH")}</>
        )}
      </div>

      <SaveToast lastSaved={store.lastSaved} />
    </div>
  );
}
