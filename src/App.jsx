import React, { useEffect, useMemo, useState } from "react";

import CashFlowChart from "./charts/CashFlowChart";
import CashFlowChartDetailed from "./charts/CashFlowChartDetailed";
import CashFlowBreakdownPie from "./charts/CashFlowBreakdownPie";
import InvestableBalancesChart from "./charts/InvestableBalancesChart";
import NetWorthChart from "./charts/NetWorthChart";
import RealEstateChart from "./charts/RealEstateChart";
import IncomeVsSpendingChart from "./charts/IncomeVsSpendingChart";
import EducationFundingChart from "./charts/EducationFundingChart";
import SuccessRateChart from "./charts/SuccessRateChart";
import TaxesChart from "./charts/TaxesChart";
import WithdrawalPlanChart from "./charts/WithdrawalPlanChart";
import WithdrawalPlanTable from "./components/tables/WithdrawalPlanTable";
import TaxWorksheet from "./components/TaxWorksheet";
import DataSnapshot from "./components/DataSnapshot";
import SuccessGauge from "./components/SuccessGauge";
import FinalAllocationSnapshot from "./components/summary/FinalAllocationSnapshot";
import SpendingBreakdownPie from "./charts/SpendingBreakdownPie";
import WithdrawalWaterfall from "./charts/WithdrawalWaterfall";
import IncomeCompositionTable from "./components/tables/IncomeCompositionTable";
import TerminalNetWorthHistogram from "./charts/TerminalNetWorthHistogram";
import SpendingSafetyChart from "./charts/SpendingSafetyChart";
import WithdrawalMixChart from "./charts/WithdrawalMixChart";
import ScenarioCompareChart from "./charts/ScenarioCompareChart";

import Field from "./components/ui/Field";
import Num from "./components/ui/Num";
import Hint from "./components/ui/Hint";

import { currency } from "./utils/formatters";
// import { PALETTE } from "./utils/palette"; // <- not directly used here; your charts can import as needed

// --- Shared chart UX helpers (angled X ticks + spacing) ---
const CHART_MARGIN = { top: 12, right: 18, left: 60, bottom: 120 };
const CHART_MARGIN_LARGE = { top: 12, right: 18, left: 60, bottom: 120 };
const X_TICK_PROPS = { angle: -45, textAnchor: 'end', height: 40, dy: 20, interval: 0, tickMargin: 12 };
const LEGEND_PROPS = { verticalAlign: 'bottom', align: 'center', wrapperStyle: { paddingTop: 18 } };


/* ------------------ Tiny helpers ------------------ */
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function percentile(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a,b)=>a-b);
  const i = (p/100)*(s.length-1);
  const lo = Math.floor(i), hi = Math.ceil(i);
  if (lo===hi) return s[lo];
  const w = i-lo;
  return s[lo]*(1-w) + s[hi]*w;
}
function randn(){
  let u=0,v=0; while(!u) u=Math.random(); while(!v) v=Math.random();
  return Math.sqrt(-2*Math.log(u)) * Math.cos(2*Math.PI*v);
}
function exportCSV(rows){
  const headers = [
    'year','ageSelf','ageSpouse',
    'bal401kSelf','bal401kSpouse','balRothSelf','balRothSpouse','balBroker','balCDs','bal529Total','totalLiquid',
    'houseVal','mortgageOpening','mortgageClosing','houseEquity',
    'c401kSelf','c401kSpouse','cRothSelf','cRothSpouse','cBroker','cCDs','c529Total',
    'rmdSelfGross','rmdSpouseGross','rmdSelfTax','rmdSpouseTax',
    'wdBroker','wdCDs','wd401kSelfGross','wd401kSelfTax','wd401kSpouseGross','wd401kSpouseTax','wdRothSelf','wdRothSpouse','wdTotal','surplusToBroker',
    'ssIncome','wageSelf','wageSpouse','annuityIncome','realEstateCF','retireSpend', 'totalSpending',
    'hsTotal','hsPaidBy529','hsFromPortfolio','collegeTotal','collegePaidBy529','collegeFromPortfolio',
    'taxBrokerageDrag','taxOtherIncome','tax401kTotal','taxTotal',
    'equityRealized','mortgagePayment','mortgageInterest','mortgagePrincipal',
    'netWorth'
  ];
  const rowsCsv = rows.map(r => [
    r.year,r.ageSelf,r.ageSpouse,
    r.bal401kSelf,r.bal401kSpouse,r.balRothSelf,r.balRothSpouse,r.balBroker,r.balCDs,r.bal529Total,r.totalLiquid,
    r.houseVal, r.mortgageOpening, r.mortgageClosing, r.houseEquity,
    r.c401kSelf,r.c401kSpouse,r.cRothSelf,r.cRothSpouse,r.cBroker,r.cCDs,r.c529Total,
    r.rmdSelfGross,r.rmdSpouseGross,r.rmdSelfTax,r.rmdSpouseTax,
    r.wdBroker,r.wdCDs,r.wd401kSelfGross,r.wd401kSelfTax,r.wd401kSpouseGross,r.wd401kSpouseTax,r.wdRothSelf,r.wdRothSpouse,r.wdTotal,r.surplusToBroker,
    r.ssIncome,r.wageSelf,r.wageSpouse,r.annuityIncome,r.realEstateCF,r.retireSpend,r.totalSpending,
    r.hsTotal,r.hsPaidBy529,r.hsFromPortfolio,r.collegeTotal,r.collegePaidBy529,r.collegeFromPortfolio,
    r.taxBrokerageDrag,r.taxOtherIncome,r.tax401kTotal,r.taxTotal,
    r.equityRealized,r.mortgagePayment,r.mortgageInterest,r.mortgagePrincipal,
    r.netWorth
  ].join(','));
  const csv = [headers.join(',')].concat(rowsCsv).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'household_retirement_yearly.csv';
  a.click(); URL.revokeObjectURL(url);
}

function getRmdFactor(age){
  const t = {
    73:27.4,74:26.5,75:25.5,76:24.6,77:23.7,78:22.9,79:22.0,80:21.1,
    81:20.2,82:19.4,83:18.5,84:17.7,85:16.8,86:16.0,87:15.2,88:14.4,
    89:13.7,90:12.9,91:12.2,92:11.5,93:10.8,94:10.1,95:9.5,96:8.8,
    97:8.4,98:7.8,99:7.3,100:6.8
  };
  if (t[age]) return t[age];
  if (age>100) return 6.0;
  return Infinity;
}

function spendingMultiplier({ageSelf, ageSpouse, retireAgeSelf, retireAgeSpouse, spendingStart, glideYears}){
  const firstRetiredYears = Math.max(ageSelf - retireAgeSelf, ageSpouse - retireAgeSpouse);
  const bothRetiredYears  = Math.min(ageSelf - retireAgeSelf, ageSpouse - retireAgeSpouse);
  const yearsSinceStart   = spendingStart==='first' ? firstRetiredYears : bothRetiredYears;
  if (glideYears<=0) return yearsSinceStart>=0 ? 1 : 0;
  return clamp(yearsSinceStart/glideYears, 0, 1);
}

function calcAgeFromDOB(month, year, baseAge) {
  if (!month || !year) return baseAge;
  const now = new Date();
  const birth = new Date(Number(year), Number(month)-1, 1);
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0) age -= 1;
  return age;
}

/* ------------------ Scenario utils (normalize structure) ------------------ */
// We'll standardize scenarios to: { id, name, createdAt, params: {...inputs} }
function makeScenarioFromState(name, params) {
  return {
    id: (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
    name,
    createdAt: Date.now(),
    params: JSON.parse(JSON.stringify(params)),
  };
}

// accepts legacy objects {name, state} or normalized {params}
function scenarioToParams(s) {
  if (!s) return null;
  if (s.params && typeof s.params === 'object') return { ...s.params };
  if (s.state && typeof s.state === 'object') return { ...s.state };
  return null;
}

/* ------------------ Single-path (deterministic) simulation ------------------ */
function simulatePath(params) {
  const {
    // Ages & policies
    currentAgeSelf, currentAgeSpouse, retireAgeSelf, retireAgeSpouse, endAge,
    selfBirthMonth, selfBirthYear, spouseBirthMonth, spouseBirthYear,
    contributionPolicy, spendingStart, spendingGlideYears,
    rmdEnabled, rmdAgeSelf, rmdAgeSpouse,

    // Returns
    meanReturnReal, stdevReturnReal,

    // Spending
    retirementSpend,

    // Social Security (annual, real)
    ss1Age, ss1Annual, ss2Age, ss2Annual,

    // Wages while working
    wageSelfAnnual, wageSpouseAnnual,

    // Annuities
    annuitySelfStartAge, annuitySelfAnnual,
    annuitySpouseStartAge, annuitySpouseAnnual,

    // Accounts per person
    start401kSelf, contrib401kSelf,
    start401kSpouse, contrib401kSpouse,
    startRothSelf, contribRothSelf,
    startRothSpouse, contribRothSpouse,

    // Taxable sleeves
    startBrokerage, contribBrokerage,
    startCDs, contribCDs, cdsRealReturn,

    // Taxes / drags
    tax401kWithdraw, capGainsDragBrokerage,
    effOrdinaryTaxRate, ssTaxablePercent, annuityTaxablePercent,

    // Real estate
    propValue, propMortgage, propAppreciationReal, propNetCashflow, sellAtRetire,

    // Mortgage (real)
    mortgageRateReal, mortgageAnnualPayment,

    // Children / 529
    children, k12CapPerChild,
  } = params;

  let ageSelf = calcAgeFromDOB(selfBirthMonth, selfBirthYear, currentAgeSelf);
  let ageSpouse = calcAgeFromDOB(spouseBirthMonth, spouseBirthYear, currentAgeSpouse);
  const kids = (children || []).map(c => ({...c}));

  let bal401kSelf   = Math.max(0, start401kSelf);
  let bal401kSpouse = Math.max(0, start401kSpouse);
  let balRothSelf   = Math.max(0, startRothSelf);
  let balRothSpouse = Math.max(0, startRothSpouse);
  let balBroker     = Math.max(0, startBrokerage);
  let balCDs        = Math.max(0, startCDs);
  for (const k of kids) { k.bal529 = Math.max(0, k.start529||0); }

  let houseVal = Math.max(0, propValue);
  let mortgage = Math.max(0, propMortgage);
  let netCF = propNetCashflow;

  const years = [];

  for (let y=0; Math.max(ageSelf, ageSpouse)<=endAge; y++) {
    const year = new Date().getFullYear() + y;

    // Tighter realism clamps (±30%) to avoid rare +50% years blowing up brokerage
const baseR   = clamp(meanReturnReal + randn() * stdevReturnReal, -0.3, 0.3);
const brokerR = clamp(baseR - capGainsDragBrokerage,             -0.3, 0.3);
const cdsR    = clamp(cdsRealReturn,                             -0.2, 0.2);

    if (houseVal>0) houseVal = houseVal * (1 + propAppreciationReal);

    const bothWorking = (ageSelf < retireAgeSelf) && (ageSpouse < retireAgeSpouse);
    const oneWorking = (!bothWorking) && ((ageSelf < retireAgeSelf) || (ageSpouse < retireAgeSpouse));
    let mult = 0;
    if (bothWorking) mult = 1;
    else if (oneWorking) mult = (contributionPolicy==='half_after_first'?0.5:(contributionPolicy==='full_until_both'?1:0));
    else mult = 0;

    const c401kSelf   = Math.max(0, contrib401kSelf)   * mult;
    const c401kSpouse = Math.max(0, contrib401kSpouse) * mult;
    const cRothSelf   = Math.max(0, contribRothSelf)   * mult;
    const cRothSpouse = Math.max(0, contribRothSpouse) * mult;
    const cBroker     = Math.max(0, contribBrokerage)  * mult;
    const cCDs        = Math.max(0, contribCDs)        * mult;

    // 529 contr + growth
    let c529Total = 0;
    for (const k of kids) {
      const beforeCollegeEnd = k.age < (k.collegeStartAge + (k.collegeYears||0));
      const c = beforeCollegeEnd ? Math.max(0, k.contrib529||0) : 0;
      k.bal529 = k.bal529 * (1+baseR) + c;
      c529Total += c;
    }

    const prevBroker = balBroker;
    const brokerTaxDrag = Math.max(0, prevBroker * Math.max(0, capGainsDragBrokerage));

    bal401kSelf   = bal401kSelf   * (1+baseR) + c401kSelf;
    bal401kSpouse = bal401kSpouse * (1+baseR) + c401kSpouse;
    balRothSelf   = balRothSelf   * (1+baseR) + cRothSelf;
    balRothSpouse = balRothSpouse * (1+baseR) + cRothSpouse;
    balBroker     = (balBroker + cBroker * 0.5) * (1 + brokerR);
    balCDs        = balCDs        * (1+cdsR)    + cCDs;

    const wageSelf   = ageSelf   < retireAgeSelf   ? (wageSelfAnnual||0)   : 0;
    const wageSpouse = ageSpouse < retireAgeSpouse ? (wageSpouseAnnual||0) : 0;
    const ssIncome = (ageSelf>=ss1Age?ss1Annual:0) + (ageSpouse>=ss2Age?ss2Annual:0);
    const annuityIncome = (ageSelf>=annuitySelfStartAge?annuitySelfAnnual:0) + (ageSpouse>=annuitySpouseStartAge?annuitySpouseAnnual:0);
    const realEstateCF = houseVal>0 ? netCF : 0;

    const spendMult = spendingMultiplier({ageSelf, ageSpouse, retireAgeSelf, retireAgeSpouse, spendingStart, glideYears: spendingGlideYears});
    const retireSpend = Math.max(0, retirementSpend) * spendMult;

    let hsTotal = 0, hsPaidBy529 = 0;
    let collegeTotal = 0, collegePaidBy529 = 0;
    for (const k of kids) {
      const inHS = k.age >= (k.hsStartAge||14) && k.age < ((k.hsStartAge||14) + (k.hsYears||0));
      const inCollege = k.age >= (k.collegeStartAge||18) && k.age < ((k.collegeStartAge||18) + (k.collegeYears||0));
      if (inHS) {
        const allowedFrom529 = Math.min(k12CapPerChild, k.hsAnnual||0);
        const from529 = Math.min(k.bal529, allowedFrom529);
        k.bal529 -= from529; hsPaidBy529 += from529; hsTotal += (k.hsAnnual||0);
      }
      if (inCollege) {
        const cost = Math.max(0, k.collegeAnnual||0);
        const from529 = Math.min(k.bal529, cost);
        k.bal529 -= from529; collegePaidBy529 += from529; collegeTotal += cost;
      }
    }
    const hsShortfall = Math.max(0, hsTotal - hsPaidBy529);
    const collegeShortfall = Math.max(0, collegeTotal - collegePaidBy529);

    // Mortgage amortization (real) — explicit opening/closing for CSV clarity
let mortgagePayment = 0, mortgageInterest = 0, mortgagePrincipal = 0;
const openingMortgage = mortgage; // <-- opening balance for this row

if (houseVal > 0 && openingMortgage > 0 && (mortgageAnnualPayment || 0) > 0) {
  mortgageInterest  = openingMortgage * Math.max(0, mortgageRateReal || 0);
  mortgagePrincipal = Math.max(0, (mortgageAnnualPayment || 0) - mortgageInterest);
  mortgagePrincipal = Math.min(mortgagePrincipal, openingMortgage);

  const closingMortgage = Math.max(0, openingMortgage - mortgagePrincipal);
  mortgagePayment = mortgageInterest + mortgagePrincipal;

  // carry forward the *closing* balance
  mortgage = closingMortgage;
}

    // RMDs
    let rmdSelfGross=0, rmdSpouseGross=0, rmdSelfTax=0, rmdSpouseTax=0;
    if (rmdEnabled) {
      const fSelf = getRmdFactor(Math.floor(ageSelf));
      if (ageSelf >= rmdAgeSelf && bal401kSelf>0 && fSelf!==Infinity) {
        rmdSelfGross = bal401kSelf / fSelf;
        const net = rmdSelfGross * (1 - tax401kWithdraw);
        rmdSelfTax = rmdSelfGross - net; bal401kSelf -= rmdSelfGross;
      }
      const fSp = getRmdFactor(Math.floor(ageSpouse));
      if (ageSpouse >= rmdAgeSpouse && bal401kSpouse>0 && fSp!==Infinity) {
        rmdSpouseGross = bal401kSpouse / fSp;
        const net = rmdSpouseGross * (1 - tax401kWithdraw);
        rmdSpouseTax = rmdSpouseGross - net; bal401kSpouse -= rmdSpouseGross;
      }
    }

    // Net need after non-portfolio income (apply RMD net as income)
    let netOutflow = retireSpend + hsShortfall + collegeShortfall + mortgagePayment
                     - ssIncome - annuityIncome - realEstateCF - wageSelf - wageSpouse;
    const netRmdSelf   = rmdSelfGross   * (1 - tax401kWithdraw);
    const netRmdSpouse = rmdSpouseGross * (1 - tax401kWithdraw);
    netOutflow -= (netRmdSelf + netRmdSpouse);

    // Withdrawals
    let wdBroker=0, wdCDs=0,
        wd401kSelfGross=0, wd401kSelfTax=0,
        wd401kSpouseGross=0, wd401kSpouseTax=0,
        wdRothSelf=0, wdRothSpouse=0,
        wdTotal=0, surplusToBroker=0;

    if (netOutflow < 0) {
      surplusToBroker = Math.abs(netOutflow);
      balBroker += surplusToBroker;
      netOutflow = 0;
    }

    if (netOutflow > 0) {
      wdBroker = Math.min(balBroker, netOutflow);
      balBroker -= wdBroker; netOutflow -= wdBroker;

      if (netOutflow > 0) {
        wdCDs = Math.min(balCDs, netOutflow);
        balCDs -= wdCDs; netOutflow -= wdCDs;
      }

      if (netOutflow > 0 && (bal401kSelf+bal401kSpouse)>0) {
        const total401k = bal401kSelf + bal401kSpouse;
        const grossNeeded = Math.min(total401k, netOutflow / Math.max(1e-6, (1 - tax401kWithdraw)));
        const portionSelf   = bal401kSelf   / total401k;
        const portionSpouse = bal401kSpouse / total401k;
        wd401kSelfGross   = grossNeeded * portionSelf;
        wd401kSpouseGross = grossNeeded * portionSpouse;
        const netSelf   = wd401kSelfGross   * (1 - tax401kWithdraw);
        const netSpouse = wd401kSpouseGross * (1 - tax401kWithdraw);
        wd401kSelfTax   = wd401kSelfGross   - netSelf;
        wd401kSpouseTax = wd401kSpouseGross - netSpouse;
        bal401kSelf   -= wd401kSelfGross;
        bal401kSpouse -= wd401kSpouseGross;
        netOutflow    -= (netSelf + netSpouse);
      }

      if (netOutflow > 0 && (balRothSelf+balRothSpouse)>0) {
        const totalRoth = balRothSelf + balRothSpouse;
        const take = Math.min(totalRoth, netOutflow);
        const pSelf = balRothSelf / totalRoth;
        wdRothSelf   = take * pSelf;
        wdRothSpouse = take * (1 - pSelf);
        balRothSelf   -= wdRothSelf;
        balRothSpouse -= wdRothSpouse;
        netOutflow    -= take;
      }

      wdTotal = wdBroker + wdCDs + wd401kSelfGross + wd401kSpouseGross + wdRothSelf + wdRothSpouse;
    }

    // Optional house sale at later retirement
    let equityRealized = 0;
    const householdRetireAge = Math.max(retireAgeSelf, retireAgeSpouse);
    if (sellAtRetire && Math.max(ageSelf, ageSpouse) === householdRetireAge && houseVal>0) {
      const equity = Math.max(0, houseVal - mortgage);
      balBroker += equity; equityRealized = equity; houseVal=0; mortgage=0; netCF=0;
    }

    const tax401kTotal = (wd401kSelfTax + wd401kSpouseTax + rmdSelfTax + rmdSpouseTax);
    const taxOtherIncome = effOrdinaryTaxRate * (
      (ssIncome * ssTaxablePercent) + (annuityIncome * annuityTaxablePercent) + wageSelf + wageSpouse
    );
    const taxBrokerageDrag = brokerTaxDrag;
    const taxTotal = tax401kTotal + taxOtherIncome + taxBrokerageDrag;

    bal401kSelf=Math.max(0,bal401kSelf); bal401kSpouse=Math.max(0,bal401kSpouse);
    balRothSelf=Math.max(0,balRothSelf); balRothSpouse=Math.max(0,balRothSpouse);
    balBroker=Math.max(0,balBroker); balCDs=Math.max(0,balCDs);
    for (const k of kids) k.bal529 = Math.max(0, k.bal529);

    const houseEquity = Math.max(0, houseVal - mortgage);
    const bal529Total = kids.reduce((s,k)=>s+(k.bal529||0),0);
    const bal401k = bal401kSelf + bal401kSpouse;
    const balRoth = balRothSelf + balRothSpouse;
    const totalLiquid = bal401k + balRoth + balBroker + balCDs;
    const totalSpending = retireSpend + hsTotal + collegeTotal + mortgagePayment;
    const incomeStreams = ssIncome + annuityIncome + realEstateCF + wageSelf + wageSpouse;
    const netWorth = totalLiquid + bal529Total + houseEquity;

    years.push({
      year,
      ageSelf, ageSpouse,
      bal401kSelf, bal401kSpouse, balRothSelf, balRothSpouse, balBroker, balCDs, bal529Total,
      bal401k, balRoth, totalLiquid,
      houseVal, 
      mortgageOpening: openingMortgage,
      mortgageClosing: mortgage,
      mortgage: mortgage,
      houseEquity, 
      netWorth,
      c401kSelf, c401kSpouse, cRothSelf, cRothSpouse, cBroker, cCDs, c529Total,
      wdBroker, wdCDs, wd401kSelfGross, wd401kSelfTax, wd401kSpouseGross, wd401kSpouseTax, wdRothSelf, wdRothSpouse, wdTotal, surplusToBroker,
      ssIncome, wageSelf, wageSpouse, annuityIncome, realEstateCF, retireSpend,
      totalSpending, incomeStreams,
      rmdSelfGross, rmdSpouseGross, rmdSelfTax, rmdSpouseTax,
      hsTotal, hsPaidBy529, hsFromPortfolio: Math.min(hsShortfall, wdBroker+wdCDs+wd401kSelfGross+wd401kSpouseGross+wdRothSelf+wdRothSpouse),
      collegeTotal, collegePaidBy529, collegeFromPortfolio: Math.max(0, Math.min(collegeShortfall, (wdBroker+wdCDs+wd401kSelfGross+wd401kSpouseGross+wdRothSelf+wdRothSpouse) - Math.min(hsShortfall, wdBroker+wdCDs+wd401kSelfGross+wd401kSpouseGross+wdRothSelf+wdRothSpouse))),
      taxBrokerageDrag, taxOtherIncome, tax401kTotal, taxTotal,
      equityRealized, mortgagePayment, mortgageInterest, mortgagePrincipal,
    });

    ageSelf += 1; ageSpouse += 1; for(const k of kids) k.age += 1;
    if (Math.max(ageSelf, ageSpouse) > endAge) break;
  }

  return years;
}

/* ------------------ Monte Carlo wrapper ------------------ */
function simulateMonteCarlo(params, sims=600){
  const paths=[]; for(let i=0;i<sims;i++) paths.push(simulatePath(params));
  const maxY = Math.max(...paths.map(p=>p.length));
  const perYear=[]; const survival=[];
  let success=0;
  for (let y=0;y<maxY;y++){
    const balances=[]; let alive=0;
    for(const p of paths){
      const snap=p[y]??p[p.length-1];
      balances.push(snap.totalLiquid);
      if ((snap.totalLiquid||0)>0) alive++;
    }
    perYear.push({
      year: new Date().getFullYear()+y,
      p10: percentile(balances,10),
      p25: percentile(balances,25),
      p50: percentile(balances,50),
      p75: percentile(balances,75),
      p90: percentile(balances,90)
    });
    survival.push({ year: new Date().getFullYear()+y, aliveRate: alive/paths.length });
  }
  for (const p of paths){
    const last=p[p.length-1];
    if (last && last.totalLiquid>0) success++;
  }
  return { paths, perYear, survival, successRate: success/sims };
}

// summarize (works for legacy or normalized scenario shapes)
function summarizeScenario(s, sims = 600) {
  if (!s) return null;
  const params = scenarioToParams(s);
  if (!params) return null;
  const det = simulatePath(params);
  const mc  = simulateMonteCarlo(params, clamp(Math.round((params?.sims ?? sims)), 50, 3000));
  const latest = det[det.length - 1] || {};
  return {
    name: s.name,
    successPct: Math.round((mc.successRate || 0) * 100),
    finalInvestable: latest.totalLiquid || 0,
    finalNetWorth: latest.netWorth || 0,
  };
}

/* ------------------ Defaults & sample child ------------------ */
const SAMPLE_CHILD = {
  name: 'Child',
  age: 14,
  hsAnnual: 20000,
  hsYears: 4,
  hsStartAge: 14,
  collegeAnnual: 30000,
  collegeYears: 4,
  collegeStartAge: 18,
  start529: 25000,
  contrib529: 3000,
};

const DEFAULTS = {
  selfBirthMonth: '', selfBirthYear: '',
  spouseBirthMonth: '', spouseBirthYear: '',
  currentAgeSelf: 52,
  currentAgeSpouse: 50,
  retireAgeSelf: 62,
  retireAgeSpouse: 64,
  endAge: 95,

  meanReturnReal: 0.04,
  stdevReturnReal: 0.10,

  wageSelfAnnual: 0,
  wageSpouseAnnual: 0,

  retirementSpend: 150000,
  spendingStart: 'both',
  spendingGlideYears: 3,

  // Display-only breakdown (fractions sum to ~1)
  spendBreakdown: {
    housing:        0.25,
    healthcare:     0.15,
    groceries:      0.15,
    transportation: 0.10,
    travel:         0.15,
    leisure:        0.10,
    other:          0.10,
  },

  ss1Age: 67, ss1Annual: 36000,
  ss2Age: 67, ss2Annual: 30000,

  annuitySelfStartAge: 65, annuitySelfAnnual: 0,
  annuitySpouseStartAge: 65, annuitySpouseAnnual: 0,

  start401kSelf: 400000, contrib401kSelf: 18000,
  start401kSpouse: 300000, contrib401kSpouse: 8000,
  startRothSelf: 100000, contribRothSelf: 6000,
  startRothSpouse: 50000, contribRothSpouse: 1000,

  startBrokerage: 350000, contribBrokerage: 27000,
  startCDs: 100000, contribCDs: 5000, cdsRealReturn: 0.01,

  tax401kWithdraw: 0.22,
  capGainsDragBrokerage: 0.003,
  effOrdinaryTaxRate: 0.20,
  ssTaxablePercent: 0.5,
  annuityTaxablePercent: 1,

  propValue: 1500000,
  propMortgage: 700000,
  propAppreciationReal: 0.01,
  propNetCashflow: 0,
  sellAtRetire: true,

  mortgageRateReal: 0.02,
  mortgageAnnualPayment: 60000,

  contributionPolicy: 'half_after_first',

  rmdEnabled: true,
  rmdAgeSelf: 73,
  rmdAgeSpouse: 73,

  children: [
    { ...SAMPLE_CHILD, name: 'Alex' },
  ],
  k12CapPerChild: 10000,

  sims: 600,
};
/* ------------------ Main Component ------------------ */
export default function App(){
  const [state,setState]=useState({...DEFAULTS});
  const [savedAt,setSavedAt]=useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [scenarioName, setScenarioName] = useState("");

  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);

  // Spending breakdown helpers
  function updateSpend(cat, val) {
    const n = Number(val);
    setState(s => ({
      ...s,
      spendBreakdown: { ...s.spendBreakdown, [cat]: Number.isFinite(n) ? n : 0 }
    }));
  }
  const spendSum = Object.values(state.spendBreakdown || {}).reduce((a, b) => a + (+b || 0), 0);
  const spendSumClose = Math.abs(spendSum - 1) < 0.02;

  // Load saved state (single effect)
  useEffect(()=>{
    const raw=localStorage.getItem('household-retire-planner-v2');
    if(!raw) return;
    try{
      const d=JSON.parse(raw);
      if(d && typeof d==='object') setState(s=>({...s,...d}));
    }catch{}
  },[]);

  // Load saved scenarios (accept legacy or normalized)
  useEffect(() => {
    const raw = localStorage.getItem('household-retire-planner-scenarios');
    if (!raw) return;
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) setScenarios(arr);
    } catch {}
  }, []);

  // Persist scenarios
  useEffect(() => {
    localStorage.setItem('household-retire-planner-scenarios', JSON.stringify(scenarios));
  }, [scenarios]);

  // Persist compare A/B by name
  useEffect(() => {
    const payload = {
      aName: compareA?.name ?? null,
      bName: compareB?.name ?? null,
    };
    localStorage.setItem('household-retire-planner-compare', JSON.stringify(payload));
  }, [compareA, compareB]);

  // Restore A/B after scenarios loaded
  useEffect(() => {
    const raw = localStorage.getItem('household-retire-planner-compare');
    if (!raw) return;
    try {
      const { aName, bName } = JSON.parse(raw) || {};
      if (aName) {
        const a = scenarios.find(s => s.name === aName);
        if (a) setCompareA(a);
      }
      if (bName) {
        const b = scenarios.find(s => s.name === bName);
        if (b) setCompareB(b);
      }
    } catch {}
  }, [scenarios]);

  // Simulations
  const det = useMemo(()=>simulatePath(state),[state]);
  const mc  = useMemo(()=>simulateMonteCarlo(state, clamp(Math.round(state.sims||600), 50, 3000)),[state]);
  const successPct = Math.round(mc.successRate*100);

  // Chart scale
  const [chartScale, setChartScale] = useState(1.2);
  const H = (base) => Math.round(base * chartScale);

  /* ---------- Setters & helpers ---------- */
  function onNum(name,val){ setState(s=>({...s,[name]:val===''? '': Number(val)||0})); }
  function onBool(name,val){ setState(s=>({...s,[name]:!!val})); }

  function save(){
    localStorage.setItem('household-retire-planner-v2', JSON.stringify(state));
    setSavedAt(new Date().toLocaleString());
  }
  function clear(){
    localStorage.removeItem('household-retire-planner-v2');
    setSavedAt(null);
  }
  function load(){ setState({...DEFAULTS}); }

  // Scenario helpers (normalize to {id,name,params})
  function saveCurrentScenario() {
    const name = scenarioName.trim();
    if (!name) return;
    const normalized = makeScenarioFromState(name, state);
    setScenarios(prev => [...prev, normalized]);
    setScenarioName("");
  }
  function deleteScenarioByName(name) {
    setScenarios(prev => prev.filter(s => s.name !== name));
    setCompareA(a => (a?.name === name ? null : a));
    setCompareB(b => (b?.name === name ? null : b));
  }

  // (optional) create quick from current
  function addScenarioFromCurrent(name = "New Scenario") {
    setScenarios(prev => [...prev, makeScenarioFromState(name, state)]);
  }
  function loadScenarioToForm(id) {
    const sc = scenarios.find(s => s.id === id || s.name === id); // allow either
    const params = scenarioToParams(sc);
    if (params) setState({ ...params });
  }
  function updateScenarioFromCurrent(id) {
    setScenarios(prev => prev.map(s => (s.id === id ? { ...s, params: { ...state } } : s)));
  }
  function renameScenario(id, newName) {
    setScenarios(prev => prev.map(s => (s.id === id ? { ...s, name: newName } : s)));
  }
  function duplicateScenario(id) {
    setScenarios(prev => {
      const src = prev.find(s => s.id === id);
      if (!src) return prev;
      const copy = makeScenarioFromState(`${src.name} (copy)`, scenarioToParams(src));
      return [...prev, copy];
    });
  }

  // Children helpers
  function updateChild(idx, patch){
    setState(s=>{
      const arr=[...s.children];
      arr[idx] = {...arr[idx], ...patch};
      return {...s, children: arr};
    });
  }
  function addChild(){
    setState(s=>({...s, children:[...s.children, {...SAMPLE_CHILD, name:`Child ${s.children.length+1}`}] }));
  }
  function removeChild(idx){
    setState(s=>({ ...s, children: s.children.filter((_,i)=>i!==idx) }));
  }

  /* ---------- Layout styles ---------- */
  const panel = {
    container: {
      maxWidth: 'min(2000px, 98vw)',
      margin: '0 auto',
      padding: 16,
      fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: 'minmax(320px, 420px) 1fr',
      gap: 16,
      alignItems: 'start',
    },
    card: {
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: 16,
      paddingBottom: 20,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      width: '100%',
      overflow: 'visible',
    },
    rightCol: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      width: '100%',
      maxWidth: '1200px',
      justifySelf: 'center',
      margin: '0 auto',
    },
    h1: { fontSize: 22, fontWeight: 700, margin: '8px 0 4px' },
    hr: { border: 0, borderTop: '1px solid #eee', margin: '12px 0' },
    button: {
      padding: '8px 12px',
      borderRadius: 10,
      border: '1px solid #d1d5db',
      background: '#f9fafb',
      cursor: 'pointer',
      fontSize: 13,
    },
    danger: {
      padding: '6px 10px',
      borderRadius: 8,
      border: '1px solid #ef4444',
      background: '#fee2e2',
      cursor: 'pointer',
      fontSize: 12,
    },
    primary: {
      padding: '8px 12px',
      borderRadius: 10,
      border: '1px solid #111827',
      background: '#111827',
      color: '#fff',
      cursor: 'pointer',
      fontSize: 13,
    },
    sub: { color: '#6b7280', fontSize: 12, margin: '4px 0 10px' },
    small: { fontSize: 12, color: '#6b7280' },
    table: {
      width: 'auto',
      maxWidth: '100%',
      borderCollapse: 'collapse',
      fontSize: 12,
      margin: '0 auto',
    },
    th: {
      textAlign: 'left',
      padding: '6px 8px',
      borderBottom: '1px solid #e5e7eb',
      whiteSpace: 'nowrap',
    },
    td: { padding: '6px 8px', borderBottom: '1px solid #f3f4f6' },
  };

  /* ---------- Derived stats for charts ---------- */
  const latest = det[det.length-1]||{};
  const taxable = Math.max(0,(latest.balBroker||0)) + Math.max(0,(latest.balCDs||0));
  const deferred = Math.max(0,(latest.bal401k||0));
  const taxfree  = Math.max(0,(latest.balRoth||0));
  const investable = Math.max(1, taxable+deferred+taxfree);
  const pct = (x)=>((x/investable)*100).toFixed(0)+'%';

  const [customYear,setCustomYear] = useState(det.length ? det[0].year : new Date().getFullYear());
  const firstYear = det.find(r => r.year === customYear) || det[0] || {};

  // Withdrawal recommendation rows
  const withdrawRows = det.map(r=>{
    const need = Math.max(0, (r.totalSpending||0) - ((r.ssIncome||0)+(r.annuityIncome||0)+(r.realEstateCF||0)+(r.wageSelf||0)+(r.wageSpouse||0)));
    const taxableAvail = Math.max(0,(r.balBroker||0));
    const cdsAvail = Math.max(0,(r.balCDs||0));
    const deferredAvail = Math.max(0,(r.bal401k||0));
    const rothAvail = Math.max(0,(r.balRoth||0));
    let remain = need;
    const fromTaxable = Math.min(taxableAvail, remain); remain -= fromTaxable;
    const fromCDs = Math.min(cdsAvail, remain); remain -= fromCDs;
    const grossNeeded401k = remain>0 ? Math.min(deferredAvail, remain/Math.max(1e-6,(1-(state.tax401kWithdraw||0)))) : 0;
    const netFrom401k = grossNeeded401k * (1-(state.tax401kWithdraw||0)); remain -= netFrom401k;
    const fromRoth = Math.max(0, Math.min(rothAvail, remain)); remain -= fromRoth;
    const notes = remain>0 ? 'Shortfall (portfolio exhausted)' : '';
    return {year:r.year,need,taxable:fromTaxable,cds:fromCDs,deferredGross:grossNeeded401k,deferredNet:netFrom401k,taxFree:fromRoth,notes};
  });

  // Effective tax rate rows
  const taxRateRows = useMemo(() => {
    return det.map((r) => {
      const taxableBase =
        (r.wageSelf || 0) +
        (r.wageSpouse || 0) +
        (r.ssIncome || 0) * (state.ssTaxablePercent || 0) +
        (r.annuityIncome || 0) * (state.annuityTaxablePercent || 0) +
        (r.wd401kSelfGross || 0) +
        (r.wd401kSpouseGross || 0) +
        (r.rmdSelfGross || 0) +
        (r.rmdSpouseGross || 0);

      const incomeTaxOnly = Math.max(
        0,
        (r.taxTotal || 0) - (r.taxBrokerageDrag || 0)
      );

      const effRate = taxableBase > 0 ? Math.min(1, incomeTaxOnly / taxableBase) : 0;

      return {
        year: r.year,
        effRate,
        taxTotal: r.taxTotal || 0,
        taxableBase,
      };
    });
  }, [det, state.ssTaxablePercent, state.annuityTaxablePercent]);

  const avgEffRate = useMemo(() => {
    if (!taxRateRows.length) return 0;
    const sum = taxRateRows.reduce((s, r) => s + (r.effRate || 0), 0);
    return sum / taxRateRows.length;
  }, [taxRateRows]);

  const avgEffPct = Math.round(avgEffRate * 100);

  // Monte Carlo terminal net worth values (one per path)
  const terminalNetWorths = useMemo(
    () =>
      (mc.paths || []).map((p) => {
        const last = p[p.length - 1] || {};
        return Math.max(0, last.netWorth || 0);
      }),
    [mc.paths]
  );

  // Withdrawal mix over time (percentages by account source)
  const withdrawalMixRows = useMemo(
    () =>
      withdrawRows.map((r) => ({
        year: r.year,
        taxable: r.taxable,
        cds: r.cds,
        deferredNet: r.deferredNet,
        taxFree: r.taxFree,
      })),
    [withdrawRows]
  );
    /* ------------------ RENDER ------------------ */
  return (
    <div style={{ background:'#f3f4f6' }}>
      <div style={panel.container}>
        <style>{`
  

            @media (max-width: 1100px) {
    .main-grid {
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)) !important;
    }
  }

  @media (min-width: 1101px) {
    .sticky-col {
      position: sticky;
      top: 16px;
      align-self: start;
      max-height: calc(100vh - 32px);
      overflow: auto !important;                /* make it scroll */
      -webkit-overflow-scrolling: touch;        /* smooth scrolling on iOS */
    }
  }




        `}</style>

        <h1 style={panel.h1}>Household Retirement Planner</h1>
        <p style={panel.small}>Educational model. Real (inflation-adjusted) dollars. Verify 529 K-12 rules for your state.</p>

        <div className="main-grid" style={{ ...panel.mainGrid, marginTop: 12 }}>
          {/* ================= INPUTS (left) ================= */}
          <section className="sticky-col" style={panel.card}>
            <h3 style={{margin:'0 0 8px',fontWeight:600}}>Ages & DOB</h3>
            <Hint text="Enter DOBs (month/year) for more precise ages. If left blank, numeric ages are used. Retirement ages are target ages (whole years)." />
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
              <Field label="Your DOB month (1–12)" hint="1 for Jan … 12 for Dec. Leave blank if unknown.">
                <Num value={state.selfBirthMonth??''} placeholder="e.g. 7" onChange={v=>onNum('selfBirthMonth',v)} />
              </Field>
              <Field label="Your DOB year" hint="4-digit year. Leave blank to use numeric age.">
                <Num value={state.selfBirthYear??''} placeholder="e.g. 1975" onChange={v=>onNum('selfBirthYear',v)} />
              </Field>
              <Field label="Spouse DOB month (1–12)" hint="1 for Jan … 12 for Dec. Leave blank if unknown.">
                <Num value={state.spouseBirthMonth??''} placeholder="e.g. 3" onChange={v=>onNum('spouseBirthMonth',v)} />
              </Field>
              <Field label="Spouse DOB year" hint="4-digit year. Leave blank to use numeric age.">
                <Num value={state.spouseBirthYear??''} placeholder="e.g. 1977" onChange={v=>onNum('spouseBirthYear',v)} />
              </Field>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:8}}>
              <Field label="Your current age (fallback)" hint="Used only if your DOB is blank. Whole years.">
                <Num value={state.currentAgeSelf} placeholder="e.g. 52" onChange={v=>onNum('currentAgeSelf',v)} />
              </Field>
              <Field label="Spouse current age (fallback)" hint="Used only if spouse DOB is blank.">
                <Num value={state.currentAgeSpouse} placeholder="e.g. 50" onChange={v=>onNum('currentAgeSpouse',v)} />
              </Field>
              <Field label="Plan to age (life expectancy)" hint="Final plan age. Commonly 90–100.">
                <Num value={state.endAge} placeholder="e.g. 95" onChange={v=>onNum('endAge',v)} />
              </Field>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginTop:8}}>
              <Field label="Your target retirement age" hint="Age you stop wages; contributions may change per policy.">
                <Num value={state.retireAgeSelf} placeholder="e.g. 62" onChange={v=>onNum('retireAgeSelf',v)} />
              </Field>
              <Field label="Spouse target retirement age" hint="Age spouse stops wages; policy may cut contributions.">
                <Num value={state.retireAgeSpouse} placeholder="e.g. 64" onChange={v=>onNum('retireAgeSpouse',v)} />
              </Field>
            </div>

            <div style={panel.hr} />

            <h4 style={{margin:'8px 0',fontWeight:600}}>Returns & Risk</h4>
            <Hint text="These are REAL (after inflation). Typical long-run assumptions: mean 3–5% real, volatility 10–15%." />
            <Field label="Expected real return (mean)">
              <Num step={0.005} value={state.meanReturnReal} placeholder="0.04" onChange={v=>onNum('meanReturnReal',v)} />
            </Field>
            <Field label="Return volatility (stdev)">
              <Num step={0.005} value={state.stdevReturnReal} placeholder="0.10" onChange={v=>onNum('stdevReturnReal',v)} />
            </Field>
            <Field label="Monte Carlo simulations (50–3000)">
              <Num value={state.sims} placeholder="600" onChange={v=>onNum('sims',v)} />
            </Field>

            <div style={panel.hr} />

            <h4 style={{margin:'8px 0',fontWeight:600}}>Wages & Core Spending</h4>
            <Hint text="Wages apply only before the respective retirement ages. Retirement spend is in today's dollars and ramps using the glide path." />
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
              <Field label="Your wage (annual)">
                <Num value={state.wageSelfAnnual} placeholder="e.g. 120000" onChange={v=>onNum('wageSelfAnnual',v)} />
              </Field>
              <Field label="Spouse wage (annual)">
                <Num value={state.wageSpouseAnnual} placeholder="e.g. 80000" onChange={v=>onNum('wageSpouseAnnual',v)} />
              </Field>
            </div>
            <Field label="Retirement annual spend (today's $)">
              <Num value={state.retirementSpend} placeholder="e.g. 150000" onChange={v=>onNum('retirementSpend',v)} />
            </Field>
            <Field label="When does retirement spending start?">
              <select value={state.spendingStart} onChange={e=>setState(s=>({...s, spendingStart:e.target.value}))} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid #d1d5db'}}>
                <option value="both">Only when both are retired</option>
                <option value="first">At the first retirement</option>
              </select>
            </Field>
            <Field label="Spending glide path (years to full)">
              <Num value={state.spendingGlideYears} placeholder="e.g. 3" onChange={v=>onNum('spendingGlideYears',v)} />
            </Field>

            {/* Spending categories (breakdown of retirement spend) */}
            <h4 style={{margin:'8px 0',fontWeight:600}}>Spending Categories Breakdown</h4>
            <Hint text="Adjust percentage weights for retirement spending categories. Total should sum ~1.0" />
            {Object.entries(state.spendBreakdown || {}).map(([cat,val])=>(
              <Field key={cat} label={`${cat} (fraction)`}>
                <Num step={0.01} value={val} onChange={v=>updateSpend(cat,v)} />
              </Field>
            ))}

            <div style={panel.hr} />

            <h4 style={{margin:'8px 0',fontWeight:600}}>Income — Social Security & Annuities</h4>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
              <Field label="SS #1 start age (you)">
                <Num value={state.ss1Age} placeholder="e.g. 67" onChange={v=>onNum('ss1Age',v)} />
              </Field>
              <Field label="SS #1 annual (real)">
                <Num value={state.ss1Annual} placeholder="e.g. 36000" onChange={v=>onNum('ss1Annual',v)} />
              </Field>
              <Field label="SS #2 start age (spouse)">
                <Num value={state.ss2Age} placeholder="e.g. 67" onChange={v=>onNum('ss2Age',v)} />
              </Field>
              <Field label="SS #2 annual (real)">
                <Num value={state.ss2Annual} placeholder="e.g. 30000" onChange={v=>onNum('ss2Annual',v)} />
              </Field>

              <Field label="Annuity (you) start age">
                <Num value={state.annuitySelfStartAge} placeholder="e.g. 65" onChange={v=>onNum('annuitySelfStartAge',v)} />
              </Field>
              <Field label="Annuity (you) annual">
                <Num value={state.annuitySelfAnnual} placeholder="0" onChange={v=>onNum('annuitySelfAnnual',v)} />
              </Field>
              <Field label="Annuity (spouse) start age">
                <Num value={state.annuitySpouseStartAge} placeholder="e.g. 65" onChange={v=>onNum('annuitySpouseStartAge',v)} />
              </Field>
              <Field label="Annuity (spouse) annual">
                <Num value={state.annuitySpouseAnnual} placeholder="0" onChange={v=>onNum('annuitySpouseAnnual',v)} />
              </Field>
            </div>

            <div style={panel.hr} />

            <h4 style={{margin:'8px 0',fontWeight:600}}>Accounts — per spouse</h4>
            <Hint text="Tax-Deferred: 401k · Tax-Free: Roth · Taxable: Brokerage & CDs." />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <Field label="401k (You) — starting">
                <Num value={state.start401kSelf} placeholder="e.g. 400000" onChange={v=>onNum('start401kSelf',v)} />
              </Field>
              <Field label="401k (Spouse) — starting">
                <Num value={state.start401kSpouse} placeholder="e.g. 300000" onChange={v=>onNum('start401kSpouse',v)} />
              </Field>
              <Field label="401k (You) — annual contrib">
                <Num value={state.contrib401kSelf} placeholder="e.g. 18000" onChange={v=>onNum('contrib401kSelf',v)} />
              </Field>
              <Field label="401k (Spouse) — annual contrib">
                <Num value={state.contrib401kSpouse} placeholder="e.g. 8000" onChange={v=>onNum('contrib401kSpouse',v)} />
              </Field>
              <Field label="Roth (You) — starting">
                <Num value={state.startRothSelf} placeholder="e.g. 100000" onChange={v=>onNum('startRothSelf',v)} />
              </Field>
              <Field label="Roth (Spouse) — starting">
                <Num value={state.startRothSpouse} placeholder="e.g. 50000" onChange={v=>onNum('startRothSpouse',v)} />
              </Field>
              <Field label="Roth (You) — annual contrib">
                <Num value={state.contribRothSelf} placeholder="e.g. 6000" onChange={v=>onNum('contribRothSelf',v)} />
              </Field>
              <Field label="Roth (Spouse) — annual contrib">
                <Num value={state.contribRothSpouse} placeholder="e.g. 1000" onChange={v=>onNum('contribRothSpouse',v)} />
              </Field>
            </div>

            <div style={{marginTop:8}} />
            <h4 style={{margin:'8px 0',fontWeight:600}}>Taxable sleeves</h4>
            <Field label="Brokerage — starting">
              <Num value={state.startBrokerage} placeholder="e.g. 350000" onChange={v=>onNum('startBrokerage',v)} />
            </Field>
            <Field label="Brokerage — annual contribution">
              <Num value={state.contribBrokerage} placeholder="e.g. 27000" onChange={v=>onNum('contribBrokerage',v)} />
            </Field>
            <Field label="CDs/Ladders — starting">
              <Num value={state.startCDs} placeholder="e.g. 100000" onChange={v=>onNum('startCDs',v)} />
            </Field>
            <Field label="CDs — annual contribution">
              <Num value={state.contribCDs} placeholder="e.g. 5000" onChange={v=>onNum('contribCDs',v)} />
            </Field>
            <Field label="CDs — real return (e.g., 0.01 = 1%)">
              <Num step={0.005} value={state.cdsRealReturn} placeholder="0.01" onChange={v=>onNum('cdsRealReturn',v)} />
            </Field>

            <div style={panel.hr} />

            <h4 style={{margin:'8px 0',fontWeight:600}}>Real Estate</h4>
            <Field label="Property value (today)">
              <Num value={state.propValue} placeholder="e.g. 1500000" onChange={v=>onNum('propValue',v)} />
            </Field>
            <Field label="Mortgage balance (today)">
              <Num value={state.propMortgage} placeholder="e.g. 700000" onChange={v=>onNum('propMortgage',v)} />
            </Field>
            <Field label="Real appreciation rate">
              <Num step={0.005} value={state.propAppreciationReal} placeholder="0.01" onChange={v=>onNum('propAppreciationReal',v)} />
            </Field>
            <Field label="Net annual cash flow">
              <Num value={state.propNetCashflow} placeholder="0" onChange={v=>onNum('propNetCashflow',v)} />
            </Field>
            <Field label="Mortgage interest rate (real)">
              <Num step={0.005} value={state.mortgageRateReal} placeholder="0.02" onChange={v=>onNum('mortgageRateReal',v)} />
            </Field>
            <Field label="Mortgage annual payment (P+I)">
              <Num value={state.mortgageAnnualPayment} placeholder="e.g. 60000" onChange={v=>onNum('mortgageAnnualPayment',v)} />
            </Field>
            <label style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
              <input type="checkbox" checked={!!state.sellAtRetire} onChange={e=>onBool('sellAtRetire', e.target.checked)} />
              <span style={{fontSize:13}}>Sell property and add equity when both spouses are retired</span>
            </label>

            <div style={panel.hr} />

            <h4 style={{margin:'8px 0',fontWeight:600}}>Taxes (simplified)</h4>
            <Field label="Effective tax on 401k withdrawals">
              <Num step={0.01} value={state.tax401kWithdraw} placeholder="0.22" onChange={v=>onNum('tax401kWithdraw',v)} />
            </Field>
            <Field label="Effective tax on ordinary income">
              <Num step={0.01} value={state.effOrdinaryTaxRate} placeholder="0.20" onChange={v=>onNum('effOrdinaryTaxRate',v)} />
            </Field>
            <Field label="SS taxable portion (0–1)">
              <Num step={0.05} value={state.ssTaxablePercent} placeholder="0.50" onChange={v=>onNum('ssTaxablePercent',v)} />
            </Field>
            <Field label="Annuity taxable portion (0–1)">
              <Num step={0.05} value={state.annuityTaxablePercent} placeholder="1.00" onChange={v=>onNum('annuityTaxablePercent',v)} />
            </Field>
            <Field label="Brokerage cap-gains drag (annual)">
              <Num step={0.001} value={state.capGainsDragBrokerage} placeholder="0.003" onChange={v=>onNum('capGainsDragBrokerage',v)} />
            </Field>

            <div style={panel.hr} />

<h4 style={{ margin: '8px 0', fontWeight: 600 }}>Required Minimum Distributions (RMDs)</h4>
<label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
  <input
    type="checkbox"
    checked={!!state.rmdEnabled}
    onChange={(e) => onBool('rmdEnabled', e.target.checked)}
  />
  <span style={{ fontSize: 13 }}>Enable RMD withdrawals</span>
</label>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
  <Field label="RMD start age (you)">
    <Num value={state.rmdAgeSelf} placeholder="73" onChange={(v) => onNum('rmdAgeSelf', v)} />
  </Field>
  <Field label="RMD start age (spouse)">
    <Num value={state.rmdAgeSpouse} placeholder="73" onChange={(v) => onNum('rmdAgeSpouse', v)} />
  </Field>
</div>

            {/* Children & 529 (per child) */}
<div style={panel.hr} />

<h4 style={{margin:'8px 0',fontWeight:600}}>Children & 529 (per child)</h4>
<Hint text="Each child has their own 529. HS/College costs optional. K-12 payments may be limited by the per-child cap." />

{(state.children || []).map((c, idx) => (
  <div
    key={idx}
    style={{
      border:'1px dashed #e5e7eb',
      borderRadius:10,
      padding:10,
      marginBottom:10
    }}
  >
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
      <Field label="Name">
        <input
          value={c.name}
          onChange={e=>updateChild(idx,{name:e.target.value})}
          style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid #d1d5db'}}
          placeholder="Child name"
        />
      </Field>
      <Field label="Age" hint="Child's current age (whole years).">
        <Num value={c.age} placeholder="e.g. 14" onChange={v=>updateChild(idx,{age:Number(v)||0})} />
      </Field>

      <Field label="HS annual" hint="Annual HS tuition. 0 if public / N/A.">
        <Num value={c.hsAnnual} placeholder="e.g. 20000" onChange={v=>updateChild(idx,{hsAnnual:Number(v)||0})} />
      </Field>
      <Field label="HS years" hint="How many years of HS tuition.">
        <Num value={c.hsYears} placeholder="e.g. 4" onChange={v=>updateChild(idx,{hsYears:Number(v)||0})} />
      </Field>
      <Field label="HS start age" hint="Age when HS tuition begins.">
        <Num value={c.hsStartAge} placeholder="e.g. 14" onChange={v=>updateChild(idx,{hsStartAge:Number(v)||0})} />
      </Field>

      <Field label="College annual" hint="Annual college cost. 0 if N/A.">
        <Num value={c.collegeAnnual} placeholder="e.g. 30000" onChange={v=>updateChild(idx,{collegeAnnual:Number(v)||0})} />
      </Field>
      <Field label="College years" hint="How many years of college.">
        <Num value={c.collegeYears} placeholder="e.g. 4" onChange={v=>updateChild(idx,{collegeYears:Number(v)||0})} />
      </Field>
      <Field label="College start age" hint="Age when college tuition begins.">
        <Num value={c.collegeStartAge} placeholder="e.g. 18" onChange={v=>updateChild(idx,{collegeStartAge:Number(v)||0})} />
      </Field>

      <Field label="529 — starting" hint="Starting 529 balance for this child.">
        <Num value={c.start529} placeholder="e.g. 25000" onChange={v=>updateChild(idx,{start529:Number(v)||0})} />
      </Field>
      <Field label="529 — annual contrib" hint="Annual 529 contribution for this child.">
        <Num value={c.contrib529} placeholder="e.g. 3000" onChange={v=>updateChild(idx,{contrib529:Number(v)||0})} />
      </Field>
    </div>

    <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
      <button style={panel.danger} onClick={()=>removeChild(idx)}>Remove child</button>
      <span style={{fontSize:12,color:'#6b7280'}}>Tip: leave HS/College at 0 if not applicable.</span>
    </div>
  </div>
))}

<button
  style={{...panel.button,background:'#e0f2fe',borderColor:'#bae6fd'}}
  onClick={addChild}
>
  + Add child
</button>

<Field label="529 — K-12 per-child annual cap" hint="Max allowed from 529 toward K-12 per child, per year. Confirm your state’s rules.">
  <Num value={state.k12CapPerChild} placeholder="e.g. 10000" onChange={v=>onNum('k12CapPerChild',v)} />
</Field>

{/* Save/Load/Export (unchanged functionality) */}
<div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
  <button style={panel.primary} onClick={save}>Save</button>
  <button style={panel.button} onClick={clear}>Clear save</button>
  <button style={{...panel.button,background:'#eef2ff',borderColor:'#c7d2fe'}} onClick={load}>Load sample</button>
  <button style={{...panel.button,background:'#e0f2fe',borderColor:'#bae6fd'}} onClick={()=>exportCSV(det)}>Export CSV</button>
  {savedAt && <span style={{fontSize:12,color:'#6b7280',alignSelf:'center'}}>Saved {savedAt}</span>}
</div>

            {/* Zero buttons */}
            <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
              <button style={{...panel.button,background:'#fff7ed',borderColor:'#fdba74'}} onClick={()=>{
                setState(s=>({
                  ...s,
                  start401kSelf:0,start401kSpouse:0,startRothSelf:0,startRothSpouse:0,
                  startBrokerage:0,startCDs:0,
                  children: s.children.map(k=>({...k, start529:0, contrib529:0}))
                }));
              }}>Zero accounts</button>

              <button style={{...panel.button,background:'#fef9c3',borderColor:'#fde68a'}} onClick={()=>{
                setState(s=>({
                  ...s,
                  contrib401kSelf:0,contrib401kSpouse:0,contribRothSelf:0,contribRothSpouse:0,
                  contribBrokerage:0,contribCDs:0,
                  children: s.children.map(k=>({...k, contrib529:0}))
                }));
              }}>Zero contribs</button>

              <button style={{...panel.button,background:'#dcfce7',borderColor:'#86efac'}} onClick={()=>{
                setState(s=>({
                  ...s,
                  ss1Annual:0, ss2Annual:0,
                  annuitySelfAnnual:0, annuitySpouseAnnual:0,
                  wageSelfAnnual:0, wageSpouseAnnual:0,
                  retirementSpend:0,
                  propNetCashflow:0
                }));
              }}>Zero income/spend</button>

              <button style={{...panel.button,background:'#e0e7ff',borderColor:'#c7d2fe'}} onClick={()=>{
                setState(s=>({
                  ...s,
                  tax401kWithdraw:0,
                  capGainsDragBrokerage:0,
                  effOrdinaryTaxRate:0,
                  ssTaxablePercent:0,
                  annuityTaxablePercent:0
                }));
              }}>Zero taxes</button>

              <button style={{...panel.button,background:'#fee2e2',borderColor:'#fecaca'}} onClick={()=>{
                setState(s=>({
                  ...s,
                  propValue:0, propMortgage:0, propAppreciationReal:0, propNetCashflow:0,
                  mortgageRateReal:0, mortgageAnnualPayment:0, sellAtRetire:false
                }));
              }}>Zero real estate</button>

              <button style={{...panel.button,background:'#f3f4f6',borderColor:'#e5e7eb'}} onClick={()=>{
                setState(s=>({
                  ...DEFAULTS,
                  selfBirthMonth:'', selfBirthYear:'',
                  spouseBirthMonth:'', spouseBirthYear:'',
                  start401kSelf:0,start401kSpouse:0,startRothSelf:0,startRothSpouse:0,
                  startBrokerage:0,startCDs:0,
                  contrib401kSelf:0,contrib401kSpouse:0,contribRothSelf:0,contribRothSpouse:0,
                  contribBrokerage:0,contribCDs:0,
                  ss1Annual:0,ss2Annual:0, annuitySelfAnnual:0,annuitySpouseAnnual:0,
                  wageSelfAnnual:0,wageSpouseAnnual:0, retirementSpend:0,
                  capGainsDragBrokerage:0, tax401kWithdraw:0, effOrdinaryTaxRate:0, ssTaxablePercent:0, annuityTaxablePercent:0,
                  propValue:0, propMortgage:0, propAppreciationReal:0, propNetCashflow:0, sellAtRetire:false,
                  mortgageRateReal:0, mortgageAnnualPayment:0,
                  children: s.children.map(k=>({
                    ...k,
                    start529:0, contrib529:0, hsAnnual:0, collegeAnnual:0
                  }))
                }));
              }}><strong>Zero EVERYTHING</strong></button>
            </div>

            {/* Scenarios */}
            <div style={{ ...panel.card, padding: 12, marginTop: 12 }}>
              <h4 style={{ margin: '0 0 8px', fontWeight: 600 }}>Scenarios</h4>
              <Hint text="Save the current inputs as a named scenario, then choose two scenarios to compare later." />

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="Scenario name (e.g., Base, EarlyRetire)"
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}
                />
                <button
                  style={{ ...panel.button, background: '#e0f2fe', borderColor: '#bae6fd' }}
                  onClick={saveCurrentScenario}
                >
                  Save scenario
                </button>
              </div>

              {scenarios.length === 0 ? (
                <div style={{ fontSize: 12, color: '#6b7280' }}>No scenarios saved yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {scenarios.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                        <strong>{s.name}</strong>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <input
                            type="radio"
                            name="compareA"
                            checked={compareA && compareA.name === s.name}
                            onChange={() => setCompareA(s)}
                          />
                          A
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <input
                            type="radio"
                            name="compareB"
                            checked={compareB && compareB.name === s.name}
                            onChange={() => setCompareB(s)}
                          />
                          B
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          style={{ ...panel.button, padding: '6px 8px' }}
                          onClick={() => {
                            const p = scenarioToParams(s);
                            if (p) setState(p);
                          }}
                          title="Load this scenario into inputs"
                        >
                          Load
                        </button>
                        <button
                          style={{ ...panel.danger, padding: '6px 8px' }}
                          onClick={() => deleteScenarioByName(s.name)}
                          title="Delete scenario"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                Compare: A = <strong>{compareA?.name || '—'}</strong>, B = <strong>{compareB?.name || '—'}</strong>
              </div>
            </div>
          </section>

          {/* ================= OUTPUTS (right) ================= */}
          <section style={panel.rightCol}>
            {/* Output controls */}
            <div style={{display:'flex', justifyContent:'flex-end', alignItems:'center', gap:12, marginBottom:4}}>
              <span style={{fontSize:12,color:'#374151'}}>Chart size</span>
              <input
                type="range"
                min="0.8"
                max="1.8"
                step="0.1"
                value={chartScale}
                onChange={(e)=>setChartScale(Number(e.target.value))}
                style={{width:180}}
              />
              <span style={{fontSize:12,color:'#6b7280'}}>{Math.round(chartScale*100)}%</span>
            </div>

            {/* Probability of Success */}
            <div style={panel.card}>
              <SuccessGauge value={successPct} />
            </div>

            {/* Scenario Compare — A vs B */}
            <div style={panel.card}>
              <h3 style={{margin:'0 0 8px',fontWeight:600}}>Scenario Compare — A vs B</h3>
              {!compareA || !compareB ? (
                <div style={{fontSize:12,color:'#6b7280'}}>
                  Select two scenarios as A and B in the left panel to compare.
                </div>
              ) : (
                (() => {
                  const A = summarizeScenario(compareA);
                  const B = summarizeScenario(compareB);
                  const series = [
                    {
                      name: A.name,
                      color: "#2563EB",
                      points: simulatePath(scenarioToParams(compareA) || state).map((r) => ({
                        year: r.year,
                        value: r.netWorth || 0,
                      })),
                    },
                    {
                      name: B.name,
                      color: "#F97316",
                      points: simulatePath(scenarioToParams(compareB) || state).map((r) => ({
                        year: r.year,
                        value: r.netWorth || 0,
                      })),
                    },
                  ];
                  return (
                    <>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,fontSize:14,marginBottom:8}}>
                        <div style={{border:'1px solid #e5e7eb',borderRadius:10,padding:10}}>
                          <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>A</div>
                          <div style={{fontWeight:600, marginBottom:6}}>{A.name}</div>
                          <div>Success: <strong>{A.successPct}%</strong></div>
                          <div>Final Investables: <strong>{currency(A.finalInvestable)}</strong></div>
                          <div>Final Net Worth: <strong>{currency(A.finalNetWorth)}</strong></div>
                        </div>
                        <div style={{border:'1px solid #e5e7eb',borderRadius:10,padding:10}}>
                          <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>B</div>
                          <div style={{fontWeight:600, marginBottom:6}}>{B.name}</div>
                          <div>Success: <strong>{B.successPct}%</strong></div>
                          <div>Final Investables: <strong>{currency(B.finalInvestable)}</strong></div>
                          <div>Final Net Worth: <strong>{currency(B.finalNetWorth)}</strong></div>
                        </div>

                        <div style={{gridColumn:'1 / -1',borderTop:'1px solid #f3f4f6',paddingTop:8,display:'flex',gap:18,flexWrap:'wrap',fontSize:13}}>
                          <span>Δ Success: <strong>{(A.successPct - B.successPct) > 0 ? '+' : ''}{A.successPct - B.successPct}%</strong></span>
                          <span>Δ Investables: <strong>{currency(A.finalInvestable - B.finalInvestable)}</strong></span>
                          <span>Δ Net Worth: <strong>{currency(A.finalNetWorth - B.finalNetWorth)}</strong></span>
                        </div>
                      </div>

                      <ScenarioCompareChart
                        height={220}
                        currencyFn={currency}
                        series={series}
                      />
                    </>
                  );
                })()
              )}
            </div>

            {/* Deterministic — Investable Balances */}
            <div style={panel.card}>
              <h3 style={{margin:'0 0 8px',fontWeight:600}}>Deterministic — Investable Balances</h3>
              <InvestableBalancesChart data={det} height={H(340)} />
              <div style={{fontSize:12,color:'#6b7280',marginTop:6,display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>
                <div>Final Investable Total: <strong>{currency(latest.totalLiquid||0)}</strong></div>
                <div>Brokerage: <strong>{currency(latest.balBroker||0)}</strong> · CDs: <strong>{currency(latest.balCDs||0)}</strong> · 401k: <strong>{currency(latest.bal401k||0)}</strong> · Roth: <strong>{currency(latest.balRoth||0)}</strong></div>
                <div>529 (total): <strong>{currency(latest.bal529Total||0)}</strong></div>
                <div>
  Property Value: <strong>{currency(latest.houseVal || 0)}</strong> · 
  Mortgage (closing): <strong>{currency(latest.mortgageClosing || latest.mortgage || 0)}</strong>
</div>
              </div>
            </div>

            {/* Net Worth Projection */}
            <div style={panel.card}>
              <h3 style={{margin:'0 0 8px',fontWeight:600}}>Net Worth Projection</h3>
              <NetWorthChart data={det} height={H(380)} currencyFn={currency} />
            </div>

            {/* Terminal Net Worth Distribution (Monte Carlo) */}
            <div style={panel.card}>
              <h3 style={{ margin: "0 0 8px", fontWeight: 600 }}>
                Terminal Net Worth Distribution (Monte Carlo)
              </h3>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                Shows how ending net worth is distributed across all Monte Carlo runs.
              </div>
              <TerminalNetWorthHistogram values={terminalNetWorths} height={H(260)} />
            </div>

            {/* Final Allocation Snapshot */}
            <div style={panel.card}>
              <FinalAllocationSnapshot
                finalSnap={latest}
                currencyFormatter={currency}
              />
            </div>

            {/* Data Snapshot */}
            <div style={panel.card}>
              <h3 style={{margin:'0 0 8px',fontWeight:600}}>
                Data Snapshot — Final & Custom Year
              </h3>

              <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:8}}>
                <label style={{fontSize:12,color:'#374151'}}>Custom year</label>
                <input
                  type="number"
                  value={customYear}
                  onChange={(e)=>setCustomYear(Number(e.target.value)||customYear)}
                  style={{width:120,padding:'6px 8px',borderRadius:8,border:'1px solid #d1d5db'}}
                />
                <span style={panel.small}>Tip: pick a year from the x-axis above.</span>
              </div>

              <DataSnapshot
                finalSnap={det[det.length-1] || {}}
                firstYear={firstYear}
                currencyFormatter={currency}
              />
            </div>

            {/* Household Cash Flow */}
            <div style={panel.card}>
              <h3 style={{ margin: "0 0 8px", fontWeight: 600 }}>
                Household Cash Flow — Sources vs Spending
              </h3>
              <CashFlowChart
                det={det}
                ssTaxablePercent={state.ssTaxablePercent}
                height={H(420)}
              />
            </div>
            <div style={panel.card}>
              <h3 style={{ margin: "0 0 8px", fontWeight: 600 }}>
                Household Cash Flow (Detailed)
              </h3>
              <CashFlowChartDetailed det={det} height={H(400)} />
            </div>

            {/* Withdrawal Waterfall — uses the "Custom year" snapshot */}
<div style={panel.card}>
  <h3 style={{margin:'0 0 8px',fontWeight:600}}>
    Withdrawal Waterfall — {firstYear.year || 'Year'}
  </h3>
  <div style={{fontSize:12,color:'#6b7280',marginBottom:6}}>
    Shows how spending is covered by income sources and withdrawals in the selected year.
  </div>
  <WithdrawalWaterfall
    latest={firstYear}
    height={H(320)}
    currencyFormatter={currency}
  />
</div>

            {/* Withdrawal Mix Over Time (By Account Type) */}
            <div style={panel.card}>
              <h3 style={{ margin: "0 0 8px", fontWeight: 600 }}>
                Withdrawal Mix Over Time — By Account Type
              </h3>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                Stacked area shows what fraction of recommended withdrawals comes from Taxable, CDs, 401k, and Roth each year.
              </div>
              <WithdrawalMixChart rows={withdrawalMixRows} height={H(320)} />
            </div>

            {/* Withdrawal Waterfall */}
            <div style={panel.card}>
              <h3 style={{margin:'0 0 8px',fontWeight:600}}>Withdrawal Waterfall</h3>
              <WithdrawalWaterfall latest={latest} height={H(320)} currencyFormatter={currency} />
            </div>

            {/* Withdrawal Recommendation */}
            <div style={panel.card}>
              <h3 style={{margin:'0 0 8px',fontWeight:600}}>Withdrawal Recommendation (30 Years)</h3>
              <p style={panel.sub}>Covers spending after non-portfolio income (Wages/SS/Annuities/RE). Sequence: Taxable → CDs → 401k (grossed) → Roth.</p>

              <WithdrawalPlanChart
                rows={withdrawRows}
                height={H(360)}
                currencyFormatter={currency}
              />

              <WithdrawalPlanTable
                rows={withdrawRows}
                formatCurrency={currency}
                maxRows={30}
              />
              <div style={{marginTop:6, fontSize:12, color:'#6b7280'}}>
                Note: effective ordinary tax rate should reflect Fed + state; this model uses your single blended rate for simplicity.
              </div>
            </div>

            {/* Real Estate — Value vs Mortgage */}
            <div style={panel.card}>
              <h3 style={{ margin: "0 0 8px", fontWeight: 600 }}>
                Real Estate — Value vs Mortgage
              </h3>
              <RealEstateChart data={det} height={H(340)} />
            </div>

            {/* Spending Safety Bands (Monte Carlo) */}
            <div style={panel.card}>
              <h3 style={{ margin: "0 0 8px", fontWeight: 600 }}>
                Spending Safety Bands (Monte Carlo)
              </h3>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                Target spending vs. an approximate band of &quot;safe&quot; spending based on p10 / p50 / p90 of Monte Carlo balances (assuming a 4% draw rate).
              </div>
              <SpendingSafetyChart det={det} perYear={mc.perYear} drawRate={0.04} height={H(340)} />
            </div>

            {/* Cash Flow Breakdown — Latest Year */}
            <div style={panel.card}>
              <h3 style={{ margin: "0 0 8px", fontWeight: 600 }}>
                Cash Flow Breakdown — Latest Year
              </h3>
              <CashFlowBreakdownPie latest={latest} height={H(320)} />
            </div>

            {/* Retirement Spending Breakdown */}
            <div style={panel.card}>
              <h3 style={{margin:'0 0 8px',fontWeight:600}}>
                Retirement Spending Breakdown
              </h3>
              <div style={{fontSize:12,color:'#6b7280',marginBottom:6}}>
                Uses your target retirement spend and the category weights below.
              </div>
              <SpendingBreakdownPie
                breakdown={state.spendBreakdown}
                annualSpend={state.retirementSpend}
                height={300}
              />
              <div style={{ marginTop: 6, fontSize: 12, color: spendSumClose ? '#6b7280' : '#b91c1c' }}>
                Total = {(spendSum * 100).toFixed(0)}%.{" "}
                {spendSumClose
                  ? "Looks good (≈100%)."
                  : "Please adjust the weights to total ≈100%."}
              </div>
            </div>

                  {/* Income Composition vs Spending & Withdrawals */}
<div style={panel.card}>
  <h3 style={{ margin: '0 0 8px', fontWeight: 600 }}>
    Income Composition vs Spending & Withdrawals
  </h3>
  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
    Bars show sources of cash used (income + portfolio withdrawals). The red
    line is total spending (retirement, education, mortgage P+I).
  </div>

<IncomeVsSpendingChart data={det} height={H(380)} />
<div style={{ marginTop: 8 }}>
  <IncomeCompositionTable det={det} currencyFormatter={currency} />
</div>
</div>

            {/* Education — HS & College Funding */}
            <div style={panel.card}>
              <h3 style={{margin:'0 0 8px',fontWeight:600}}>Education — HS & College Funding</h3>
              <EducationFundingChart data={det} height={H(420)} />
            </div>

            {/* Success Rate Over Time (Monte Carlo) */}
            <div style={panel.card}>
              <h3 style={{margin:'0 0 8px',fontWeight:600}}>Success Rate Over Time (Monte Carlo)</h3>
              <SuccessRateChart data={mc.survival} height={H(300)} />
            </div>

            {/* Effective Tax Rate & Total Taxes Over Time */}
            <div style={panel.card}>
              <h3 style={{margin:'0 0 8px',fontWeight:600}}>
                Effective Tax Rate & Total Taxes Over Time — Avg: {avgEffPct}%
              </h3>

              <div style={{marginTop:4,fontSize:12,color:'#6b7280'}}>
                Effective rate = income taxes ÷ (wages + taxable SS + taxable annuities + 401k withdrawals + RMDs).<br />
                (Brokerage drag excluded — already modeled in returns.) Simplified view — not a filing calc.
              </div>

              <TaxesChart
                data={det}
                ssTaxablePercent={state.ssTaxablePercent}
                annuityTaxablePercent={state.annuityTaxablePercent}
                height={H(340)}
              />
            </div>

            {/* Tax worksheet */}
            <div style={panel.card}>
              <h3 style={{margin:'0 0 8px',fontWeight:600}}>Tax Worksheet — Latest Year (Simplified)</h3>
              <TaxWorksheet
                latest={latest}
                ssTaxablePercent={state.ssTaxablePercent}
                annuityTaxablePercent={state.annuityTaxablePercent}
                effOrdinaryTaxRate={state.effOrdinaryTaxRate}
                currencyFormatter={currency}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
