import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart, Line,
  ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

import CashFlowChart from "./charts/CashFlowChart";  
import CashFlowChartDetailed from "./charts/CashFlowChartDetailed";
import InvestableBalancesChart from "./charts/InvestableBalancesChart";

/* ------------------ Color palette (consistent across charts) ------------------ */
const PALETTE = {
  grid:   "#e5e7eb",
  text:   "#111827",
  accent: "#2563eb", // blue
  a2:     "#14b8a6", // teal
  a3:     "#f59e0b", // amber
  a4:     "#ef4444", // red
  a5:     "#8b5cf6", // violet
  a6:     "#db2777", // rose
  a7:     "#10b981", // emerald
};

/* ------------------ Tiny helpers ------------------ */
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function currency(n){
  if(!Number.isFinite(n)) return "-";
  return n.toLocaleString(undefined,{style:"currency",currency:"USD",maximumFractionDigits:0});
}
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
    'houseVal','mortgage','houseEquity',
    'c401kSelf','c401kSpouse','cRothSelf','cRothSpouse','cBroker','cCDs','c529Total',
    'rmdSelfGross','rmdSpouseGross','rmdSelfTax','rmdSpouseTax',
    'wdBroker','wdCDs','wd401kSelfGross','wd401kSelfTax','wd401kSpouseGross','wd401kSpouseTax','wdRothSelf','wdRothSpouse','wdTotal','surplusToBroker',
    'ssIncome','wageSelf','wageSpouse','annuityIncome','realEstateCF','retireSpend',
    'hsTotal','hsPaidBy529','hsFromPortfolio','collegeTotal','collegePaidBy529','collegeFromPortfolio',
    'taxBrokerageDrag','taxOtherIncome','tax401kTotal','taxTotal',
    'equityRealized','mortgagePayment','mortgageInterest','mortgagePrincipal',
    'netWorth'
  ];
  const rowsCsv = rows.map(r => [
    r.year,r.ageSelf,r.ageSpouse,
    r.bal401kSelf,r.bal401kSpouse,r.balRothSelf,r.balRothSpouse,r.balBroker,r.balCDs,r.bal529Total,r.totalLiquid,
    r.houseVal,r.mortgage,r.houseEquity,
    r.c401kSelf,r.c401kSpouse,r.cRothSelf,r.cRothSpouse,r.cBroker,r.cCDs,r.c529Total,
    r.rmdSelfGross,r.rmdSpouseGross,r.rmdSelfTax,r.rmdSpouseTax,
    r.wdBroker,r.wdCDs,r.wd401kSelfGross,r.wd401kSelfTax,r.wd401kSpouseGross,r.wd401kSpouseTax,r.wdRothSelf,r.wdRothSpouse,r.wdTotal,r.surplusToBroker,
    r.ssIncome,r.wageSelf,r.wageSpouse,r.annuityIncome,r.realEstateCF,r.retireSpend,
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
  // Simplified IRS Uniform Lifetime Table (selected ages)
  const t = {
    73:27.4,74:26.5,75:25.5,76:24.6,77:23.7,78:22.9,79:22.0,80:21.1,
    81:20.2,82:19.4,83:18.5,84:17.7,85:16.8,86:16.0,87:15.2,88:14.4,
    89:13.7,90:12.9,91:12.2,92:11.5,93:10.8,94:10.1,95:9.5,96:8.8,
    97:8.4,98:7.8,99:7.3,100:6.8
  };
  if (t[age]) return t[age];
  if (age>100) return 6.0;
  return Infinity; // under threshold → no RMD in this model
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

/* ------------------ Single-path (deterministic) simulation ------------------ */
function simulatePath(params) {
  const {
    // Ages & policies
    currentAgeSelf, currentAgeSpouse, retireAgeSelf, retireAgeSpouse, endAge,
    selfBirthMonth, selfBirthYear, spouseBirthMonth, spouseBirthYear,
    contributionPolicy, // 'full_until_both' | 'half_after_first' | 'stop_after_first'
    spendingStart,      // 'both' | 'first'
    spendingGlideYears, // ramp years
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

  // Ages (DOB overrides numeric ages when present)
  let ageSelf = calcAgeFromDOB(selfBirthMonth, selfBirthYear, currentAgeSelf);
  let ageSpouse = calcAgeFromDOB(spouseBirthMonth, spouseBirthYear, currentAgeSpouse);
  const kids = children.map(c => ({...c}));

  // Balances
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

    // Real returns (bounded)
    const baseR = clamp(meanReturnReal + randn()*stdevReturnReal, -0.5, 0.5);
    const brokerR = clamp(baseR - capGainsDragBrokerage, -0.5, 0.5);
    const cdsR = clamp(cdsRealReturn, -0.2, 0.2);

    // Real estate growth
    if (houseVal>0) houseVal = houseVal * (1 + propAppreciationReal);

    // Contribution policy
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

    // 529 contributions + growth
    let c529Total = 0;
    for (const k of kids) {
      const beforeCollegeEnd = k.age < (k.collegeStartAge + (k.collegeYears||0));
      const c = beforeCollegeEnd ? Math.max(0, k.contrib529||0) : 0;
      k.bal529 = k.bal529 * (1+baseR) + c;
      c529Total += c;
    }

    // Grow main sleeves
    const prevBroker = balBroker;
    const brokerTaxDrag = Math.max(0, prevBroker * Math.max(0, capGainsDragBrokerage));

    bal401kSelf   = bal401kSelf   * (1+baseR) + c401kSelf;
    bal401kSpouse = bal401kSpouse * (1+baseR) + c401kSpouse;
    balRothSelf   = balRothSelf   * (1+baseR) + cRothSelf;
    balRothSpouse = balRothSpouse * (1+baseR) + cRothSpouse;
    balBroker     = balBroker     * (1+brokerR) + cBroker;
    balCDs        = balCDs        * (1+cdsR)    + cCDs;

    // Income streams
    const wageSelf   = ageSelf   < retireAgeSelf   ? (wageSelfAnnual||0)   : 0;
    const wageSpouse = ageSpouse < retireAgeSpouse ? (wageSpouseAnnual||0) : 0;
    const ssIncome = (ageSelf>=ss1Age?ss1Annual:0) + (ageSpouse>=ss2Age?ss2Annual:0);
    const annuityIncome = (ageSelf>=annuitySelfStartAge?annuitySelfAnnual:0) + (ageSpouse>=annuitySpouseStartAge?annuitySpouseAnnual:0);
    const realEstateCF = houseVal>0 ? netCF : 0;

    // Spending (glide)
    const spendMult = spendingMultiplier({ageSelf, ageSpouse, retireAgeSelf, retireAgeSpouse, spendingStart, glideYears: spendingGlideYears});
    const retireSpend = Math.max(0, retirementSpend) * spendMult;

    // Tuition: HS & College per kid
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

    // Mortgage amortization
    let mortgagePayment = 0, mortgageInterest = 0, mortgagePrincipal = 0;
    if (houseVal>0 && mortgage>0 && mortgageAnnualPayment>0) {
      mortgageInterest = mortgage * Math.max(0, mortgageRateReal);
      mortgagePrincipal = Math.max(0, mortgageAnnualPayment - mortgageInterest);
      mortgagePrincipal = Math.min(mortgagePrincipal, mortgage);
      mortgage = Math.max(0, mortgage - mortgagePrincipal);
      mortgagePayment = mortgageInterest + mortgagePrincipal;
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
      // 1) Brokerage
      wdBroker = Math.min(balBroker, netOutflow);
      balBroker -= wdBroker; netOutflow -= wdBroker;

      // 2) CDs
      if (netOutflow > 0) {
        wdCDs = Math.min(balCDs, netOutflow);
        balCDs -= wdCDs; netOutflow -= wdCDs;
      }

      // 3) 401k (gross up)
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

      // 4) Roth (pro-rata)
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

      wdTotal = wdBroker + wdCDs + wd401kSelfGross + wd401kSpouseGross + wdRothSelf + wdRothSpouse + rmdSelfGross + rmdSpouseGross;
    }

    // Optional house sale at later retirement
    let equityRealized = 0;
    const householdRetireAge = Math.max(retireAgeSelf, retireAgeSpouse);
    if (sellAtRetire && Math.max(ageSelf, ageSpouse) === householdRetireAge && houseVal>0) {
      const equity = Math.max(0, houseVal - mortgage);
      balBroker += equity; equityRealized = equity; houseVal=0; mortgage=0; netCF=0;
    }

    // Simplified taxes (reporting)
    const tax401kTotal = (wd401kSelfTax + wd401kSpouseTax + rmdSelfTax + rmdSpouseTax);
    const taxOtherIncome = effOrdinaryTaxRate * (
      (ssIncome * ssTaxablePercent) + (annuityIncome * annuityTaxablePercent) + wageSelf + wageSpouse
    );
    const taxBrokerageDrag = brokerTaxDrag; // already modeled in returns
    const taxTotal = tax401kTotal + taxOtherIncome + taxBrokerageDrag;

    // Guards + aggregates
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
      // balances
      bal401kSelf, bal401kSpouse, balRothSelf, balRothSpouse, balBroker, balCDs, bal529Total,
      bal401k, balRoth, totalLiquid,
      houseVal, mortgage, houseEquity, netWorth,
      // flows
      c401kSelf, c401kSpouse, cRothSelf, cRothSpouse, cBroker, cCDs, c529Total,
      wdBroker, wdCDs, wd401kSelfGross, wd401kSelfTax, wd401kSpouseGross, wd401kSpouseTax, wdRothSelf, wdRothSpouse, wdTotal, surplusToBroker,
      // income & spending
      ssIncome, wageSelf, wageSpouse, annuityIncome, realEstateCF, retireSpend,
      totalSpending, incomeStreams,
      // RMD
      rmdSelfGross, rmdSpouseGross, rmdSelfTax, rmdSpouseTax,
      // education
      hsTotal, hsPaidBy529, hsFromPortfolio: Math.min(hsShortfall, wdBroker+wdCDs+wd401kSelfGross+wd401kSpouseGross+wdRothSelf+wdRothSpouse),
      collegeTotal, collegePaidBy529, collegeFromPortfolio: Math.max(0, Math.min(collegeShortfall, (wdBroker+wdCDs+wd401kSelfGross+wd401kSpouseGross+wdRothSelf+wdRothSpouse) - Math.min(hsShortfall, wdBroker+wdCDs+wd401kSelfGross+wd401kSpouseGross+wdRothSelf+wdRothSpouse))),
      // taxes
      taxBrokerageDrag, taxOtherIncome, tax401kTotal, taxTotal,
      // real estate
      equityRealized, mortgagePayment, mortgageInterest, mortgagePrincipal,
    });

    // Next year
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
  // Ages (DOB optional; if blank, numeric ages are used)
  selfBirthMonth: '', selfBirthYear: '',
  spouseBirthMonth: '', spouseBirthYear: '',
  currentAgeSelf: 52,
  currentAgeSpouse: 50,
  retireAgeSelf: 62,
  retireAgeSpouse: 64,
  endAge: 95,

  // Returns (real)
  meanReturnReal: 0.04,
  stdevReturnReal: 0.10,

  // Wages while working
  wageSelfAnnual: 0,
  wageSpouseAnnual: 0,

  // Spending
  retirementSpend: 150000,
  spendingStart: 'both',       // 'both' | 'first'
  spendingGlideYears: 3,       // ramp years to full spend

  // Social Security (annual, real)
  ss1Age: 67, ss1Annual: 36000,
  ss2Age: 67, ss2Annual: 30000,

  // Annuities (set to 0 if none)
  annuitySelfStartAge: 65, annuitySelfAnnual: 0,
  annuitySpouseStartAge: 65, annuitySpouseAnnual: 0,

  // Accounts — per spouse
  start401kSelf: 400000, contrib401kSelf: 18000,
  start401kSpouse: 300000, contrib401kSpouse: 8000,
  startRothSelf: 100000, contribRothSelf: 6000,
  startRothSpouse: 50000, contribRothSpouse: 1000,

  // Taxable sleeves
  startBrokerage: 350000, contribBrokerage: 27000,
  startCDs: 100000, contribCDs: 5000, cdsRealReturn: 0.01,

  // Taxes / drags (simplified)
  tax401kWithdraw: 0.22,
  capGainsDragBrokerage: 0.003,
  effOrdinaryTaxRate: 0.20,
  ssTaxablePercent: 0.5,
  annuityTaxablePercent: 1,

  // Real estate
  propValue: 1500000,
  propMortgage: 700000,
  propAppreciationReal: 0.01,
  propNetCashflow: 0,
  sellAtRetire: true,

  // Mortgage (real)
  mortgageRateReal: 0.02,
  mortgageAnnualPayment: 60000,

  // Policy
  contributionPolicy: 'half_after_first', // 'full_until_both' | 'half_after_first' | 'stop_after_first'

  // RMD
  rmdEnabled: true,
  rmdAgeSelf: 73,
  rmdAgeSpouse: 73,

  // Children (dynamic)
  children: [
    { ...SAMPLE_CHILD, name: 'Alex' },
  ],
  k12CapPerChild: 10000,

  // Monte Carlo
  sims: 600,
};

/* ------------------ Main Component ------------------ */
export default function App(){
  const [state,setState]=useState({...DEFAULTS});
  const [savedAt,setSavedAt]=useState(null);

  // Load saved state
  useEffect(()=>{
    const raw=localStorage.getItem('household-retire-planner-v2');
    if(!raw) return;
    try{
      const d=JSON.parse(raw);
      if(d && typeof d==='object') setState(s=>({...s,...d}));
    }catch{}
  },[]);

  // Simulations
  const det = useMemo(()=>simulatePath(state),[state]);
  const mc  = useMemo(()=>simulateMonteCarlo(state, clamp(Math.round(state.sims||600), 50, 3000)),[state]);
  const successPct = Math.round(mc.successRate*100);

  // Chart scale control
  const [chartScale, setChartScale] = useState(1.2);
  const H = (base) => Math.round(base * chartScale);

  /* ---------- Setters & helpers ---------- */
  function onNum(name,val){ setState(s=>({...s,[name]:val===''? '': Number(val)||0})); }
  function onBool(name,val){ setState(s=>({...s,[name]:!!val})); }

  function save(){ localStorage.setItem('household-retire-planner-v2', JSON.stringify(state)); setSavedAt(new Date().toLocaleString()); }
  function clear(){ localStorage.removeItem('household-retire-planner-v2'); setSavedAt(null); }
  function load(){ setState({...DEFAULTS}); }

  function zeroAllAccounts(){
    setState(s=>({
      ...s,
      start401kSelf:0,start401kSpouse:0,startRothSelf:0,startRothSpouse:0,
      startBrokerage:0,startCDs:0,
      children: s.children.map(k=>({...k, start529:0, contrib529:0}))
    }));
  }
  function zeroAllContribs(){
    setState(s=>({
      ...s,
      contrib401kSelf:0,contrib401kSpouse:0,contribRothSelf:0,contribRothSpouse:0,
      contribBrokerage:0,contribCDs:0,
      children: s.children.map(k=>({...k, contrib529:0}))
    }));
  }
  function zeroAllIncomeSpend(){
    setState(s=>({
      ...s,
      ss1Annual:0, ss2Annual:0,
      annuitySelfAnnual:0, annuitySpouseAnnual:0,
      wageSelfAnnual:0, wageSpouseAnnual:0,
      retirementSpend:0,
      propNetCashflow:0
    }));
  }
  function zeroAllTaxes(){
    setState(s=>({
      ...s,
      tax401kWithdraw:0,
      capGainsDragBrokerage:0,
      effOrdinaryTaxRate:0,
      ssTaxablePercent:0,
      annuityTaxablePercent:0
    }));
  }
  function zeroAllRealEstate(){
    setState(s=>({
      ...s,
      propValue:0, propMortgage:0, propAppreciationReal:0, propNetCashflow:0,
      mortgageRateReal:0, mortgageAnnualPayment:0, sellAtRetire:false
    }));
  }
  function zeroEverything(){
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
      children: state.children.map(k=>({
        ...k,
        start529:0, contrib529:0, hsAnnual:0, collegeAnnual:0
      }))
    }));
  }

  // Child list helpers
  function updateChild(idx, patch){ setState(s=>{ const arr=[...s.children]; arr[idx] = {...arr[idx], ...patch}; return {...s, children: arr}; }); }
  function addChild(){ setState(s=>({...s, children:[...s.children, {...SAMPLE_CHILD, name:`Child ${s.children.length+1}`}] })); }
  function removeChild(idx){ setState(s=>{ const arr=s.children.filter((_,i)=>i!==idx); return {...s, children: arr}; }); }

  /* ---------- Layout styles (with centering fixes) ---------- */
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
      gridTemplateColumns: 'minmax(320px, 420px) 1fr', // left fixed-ish + flexible right
      gap: 16,
      alignItems: 'start',
    },
    // Every "card" fills its parent width
    card: {
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      width: '100%',
    },
    // Center the whole right column; keep it responsive
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
    /* ---------- Derived stats used by charts (will render in Part 3/4) ---------- */
  const latest = det[det.length-1]||{};
  const taxable = Math.max(0,(latest.balBroker||0)) + Math.max(0,(latest.balCDs||0));
  const deferred = Math.max(0,(latest.bal401k||0));
  const taxfree  = Math.max(0,(latest.balRoth||0));
  const investable = Math.max(1, taxable+deferred+taxfree);
  const pct = (x)=>((x/investable)*100).toFixed(0)+'%';

  const [customYear,setCustomYear] = useState(det.length ? det[0].year : new Date().getFullYear());
  const finalSnap = latest;
  const firstYear = det.find(r => r.year === customYear) || det[0] || {};

  // Withdrawal recommendation rows (used in Part 3)
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

  // === Effective Tax Rate (derived per year) ===
// Effective rate = (income taxes only) ÷ (wages + taxable SS + taxable annuities + 401k withdrawals + RMDs)
// Note: we EXCLUDE brokerage drag from the numerator because it’s a return friction, not an income tax.
const taxRateRows = useMemo(() => {
  return det.map((r) => {
    // Denominator: taxable income streams only
    const taxableBase =
      (r.wageSelf || 0) +
      (r.wageSpouse || 0) +
      (r.ssIncome || 0) * (state.ssTaxablePercent || 0) +
      (r.annuityIncome || 0) * (state.annuityTaxablePercent || 0) +
      (r.wd401kSelfGross || 0) +
      (r.wd401kSpouseGross || 0) +
      (r.rmdSelfGross || 0) +
      (r.rmdSpouseGross || 0);

    // Numerator: total taxes MINUS brokerage drag (drag is not an income tax)
    const incomeTaxOnly = Math.max(
      0,
      (r.taxTotal || 0) - (r.taxBrokerageDrag || 0)
    );

    // Effective rate; clamp visually to 0–100% to avoid spikes in tiny-base years
    const effRate = taxableBase > 0 ? Math.min(1, incomeTaxOnly / taxableBase) : 0;

    return {
      year: r.year,
      effRate,                   // 0–1 for the % line
      taxTotal: r.taxTotal || 0, // keep full taxes for the bars
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
              overflow: auto;
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
            <Field label="Expected real return (mean)" hint="Annual average return after inflation, e.g., 0.04 = 4%.">
              <Num step={0.005} value={state.meanReturnReal} placeholder="0.04" onChange={v=>onNum('meanReturnReal',v)} />
            </Field>
            <Field label="Return volatility (stdev)" hint="Annual volatility, e.g., 0.10 = 10%. Higher = wider Monte Carlo spread.">
              <Num step={0.005} value={state.stdevReturnReal} placeholder="0.10" onChange={v=>onNum('stdevReturnReal',v)} />
            </Field>
            <Field label="Monte Carlo simulations (50–3000)" hint="Higher = smoother percentiles; slower to compute. 600–1000 is a good range.">
              <Num value={state.sims} placeholder="600" onChange={v=>onNum('sims',v)} />
            </Field>

            <div style={panel.hr} />

            <h4 style={{margin:'8px 0',fontWeight:600}}>Wages & Core Spending</h4>
            <Hint text="Wages apply only before the respective retirement ages. Retirement spend is in today's dollars and ramps using the glide path." />
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
              <Field label="Your wage (annual)" hint="Gross annual wages until your retirement age. Set 0 if none.">
                <Num value={state.wageSelfAnnual} placeholder="e.g. 120000" onChange={v=>onNum('wageSelfAnnual',v)} />
              </Field>
              <Field label="Spouse wage (annual)" hint="Gross annual wages until spouse retirement age.">
                <Num value={state.wageSpouseAnnual} placeholder="e.g. 80000" onChange={v=>onNum('wageSpouseAnnual',v)} />
              </Field>
            </div>
            <Field label="Retirement annual spend (today's $)" hint="Baseline lifestyle spend after retirement (excl. mortgage/college/HS).">
              <Num value={state.retirementSpend} placeholder="e.g. 150000" onChange={v=>onNum('retirementSpend',v)} />
            </Field>
            <Field label="When does retirement spending start?" hint="‘Both’ waits until both spouses are retired. ‘First’ starts when the first retires.">
              <select value={state.spendingStart} onChange={e=>setState(s=>({...s, spendingStart:e.target.value}))} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid #d1d5db'}}>
                <option value="both">Only when both are retired</option>
                <option value="first">At the first retirement</option>
              </select>
            </Field>
            <Field label="Spending glide path (years to ramp to full)" hint="Years to ramp from 0 to the full retirement spend target.">
              <Num value={state.spendingGlideYears} placeholder="e.g. 3" onChange={v=>onNum('spendingGlideYears',v)} />
            </Field>
                        <div style={panel.hr} />

            <h4 style={{margin:'8px 0',fontWeight:600}}>Income — Social Security & Annuities</h4>
            <Hint text="Enter annual REAL amounts. Taxability is in Taxes panel. Annuities start at the specified ages per person." />
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
              <Field label="SS #1 start age (you)" hint="Age when your SS starts (whole years).">
                <Num value={state.ss1Age} placeholder="e.g. 67" onChange={v=>onNum('ss1Age',v)} />
              </Field>
              <Field label="SS #1 annual (today's $)" hint="Annual SS in today's dollars.">
                <Num value={state.ss1Annual} placeholder="e.g. 36000" onChange={v=>onNum('ss1Annual',v)} />
              </Field>
              <Field label="SS #2 start age (spouse)" hint="Age spouse's SS begins.">
                <Num value={state.ss2Age} placeholder="e.g. 67" onChange={v=>onNum('ss2Age',v)} />
              </Field>
              <Field label="SS #2 annual (today's $)" hint="Spouse annual SS in today's dollars.">
                <Num value={state.ss2Annual} placeholder="e.g. 30000" onChange={v=>onNum('ss2Annual',v)} />
              </Field>

              <Field label="Annuity (you) start age" hint="Set to 0 if none.">
                <Num value={state.annuitySelfStartAge} placeholder="e.g. 65" onChange={v=>onNum('annuitySelfStartAge',v)} />
              </Field>
              <Field label="Annuity (you) annual" hint="Annual annuity income in today's dollars.">
                <Num value={state.annuitySelfAnnual} placeholder="e.g. 0" onChange={v=>onNum('annuitySelfAnnual',v)} />
              </Field>
              <Field label="Annuity (spouse) start age" hint="Set to 0 if none.">
                <Num value={state.annuitySpouseStartAge} placeholder="e.g. 65" onChange={v=>onNum('annuitySpouseStartAge',v)} />
              </Field>
              <Field label="Annuity (spouse) annual" hint="Spouse annual annuity income.">
                <Num value={state.annuitySpouseAnnual} placeholder="e.g. 0" onChange={v=>onNum('annuitySpouseAnnual',v)} />
              </Field>
            </div>

            <div style={panel.hr} />

            <h4 style={{margin:'8px 0',fontWeight:600}}>Accounts — per spouse</h4>
            <Hint text="Tax-Deferred: 401k · Tax-Free: Roth · Taxable: Brokerage & CDs. Contributions adjust when one spouse retires per your policy below." />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <Field label="401k (You) — starting" hint="Current 401k balance for you.">
                <Num value={state.start401kSelf} placeholder="e.g. 400000" onChange={v=>onNum('start401kSelf',v)} />
              </Field>
              <Field label="401k (Spouse) — starting" hint="Current spouse 401k balance.">
                <Num value={state.start401kSpouse} placeholder="e.g. 300000" onChange={v=>onNum('start401kSpouse',v)} />
              </Field>
              <Field label="401k (You) — annual contrib" hint="Your annual pre-tax contribution while working.">
                <Num value={state.contrib401kSelf} placeholder="e.g. 18000" onChange={v=>onNum('contrib401kSelf',v)} />
              </Field>
              <Field label="401k (Spouse) — annual contrib" hint="Spouse annual pre-tax contribution while working.">
                <Num value={state.contrib401kSpouse} placeholder="e.g. 8000" onChange={v=>onNum('contrib401kSpouse',v)} />
              </Field>
              <Field label="Roth (You) — starting" hint="Your Roth IRA balance.">
                <Num value={state.startRothSelf} placeholder="e.g. 100000" onChange={v=>onNum('startRothSelf',v)} />
              </Field>
              <Field label="Roth (Spouse) — starting" hint="Spouse Roth IRA balance.">
                <Num value={state.startRothSpouse} placeholder="e.g. 50000" onChange={v=>onNum('startRothSpouse',v)} />
              </Field>
              <Field label="Roth (You) — annual contrib" hint="Your annual Roth contribution while working.">
                <Num value={state.contribRothSelf} placeholder="e.g. 6000" onChange={v=>onNum('contribRothSelf',v)} />
              </Field>
              <Field label="Roth (Spouse) — annual contrib" hint="Spouse annual Roth contribution while working.">
                <Num value={state.contribRothSpouse} placeholder="e.g. 1000" onChange={v=>onNum('contribRothSpouse',v)} />
              </Field>
            </div>

            <div style={{marginTop:8}} />
            <h4 style={{margin:'8px 0',fontWeight:600}}>Taxable sleeves</h4>
            <Hint text="Brokerage drag is the annual capital-gains realization drag on returns (e.g., 0.003 = 0.3%/yr). CDs real return is after inflation." />
            <Field label="Brokerage — starting" hint="Current taxable brokerage balance.">
              <Num value={state.startBrokerage} placeholder="e.g. 350000" onChange={v=>onNum('startBrokerage',v)} />
            </Field>
            <Field label="Brokerage — annual contribution" hint="Annual taxable savings while working.">
              <Num value={state.contribBrokerage} placeholder="e.g. 27000" onChange={v=>onNum('contribBrokerage',v)} />
            </Field>
            <Field label="CDs/Ladders — starting" hint="Cash/CD ladders modeled as a separate sleeve.">
              <Num value={state.startCDs} placeholder="e.g. 100000" onChange={v=>onNum('startCDs',v)} />
            </Field>
            <Field label="CDs — annual contribution" hint="New money going to CDs each year while working.">
              <Num value={state.contribCDs} placeholder="e.g. 5000" onChange={v=>onNum('contribCDs',v)} />
            </Field>
            <Field label="CDs — real return (e.g., 0.01 = 1%)" hint="After inflation. 0.00–0.02 is common depending on rates.">
              <Num step={0.005} value={state.cdsRealReturn} placeholder="0.01" onChange={v=>onNum('cdsRealReturn',v)} />
            </Field>

            <div style={panel.hr} />

            <h4 style={{margin:'8px 0',fontWeight:600}}>Real Estate</h4>
            <Hint text="Primary or rental in real (after-inflation) terms. Mortgage split is computed from real rate and annual payment." />
            <Field label="Property value (today)" hint="Current market value. Set 0 if no property.">
              <Num value={state.propValue} placeholder="e.g. 1500000" onChange={v=>onNum('propValue',v)} />
            </Field>
            <Field label="Mortgage balance (today)" hint="Current outstanding mortgage principal.">
              <Num value={state.propMortgage} placeholder="e.g. 700000" onChange={v=>onNum('propMortgage',v)} />
            </Field>
            <Field label="Real appreciation rate (e.g., 0.01 = 1%)" hint="Home price growth after inflation. 0–2% typical.">
              <Num step={0.005} value={state.propAppreciationReal} placeholder="0.01" onChange={v=>onNum('propAppreciationReal',v)} />
            </Field>
            <Field label="Net annual cash flow (rent − expenses)" hint="For rentals: positive means net cash in. 0 for primary home.">
              <Num value={state.propNetCashflow} placeholder="e.g. 0" onChange={v=>onNum('propNetCashflow',v)} />
            </Field>
            <Field label="Mortgage interest rate (real)" hint="Interest rate after inflation (real).">
              <Num step={0.005} value={state.mortgageRateReal} placeholder="e.g. 0.02" onChange={v=>onNum('mortgageRateReal',v)} />
            </Field>
            <Field label="Mortgage annual payment (P+I)" hint="Total annual principal + interest. Taxes/insurance excluded.">
              <Num value={state.mortgageAnnualPayment} placeholder="e.g. 60000" onChange={v=>onNum('mortgageAnnualPayment',v)} />
            </Field>
            <label style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
              <input type="checkbox" checked={!!state.sellAtRetire} onChange={e=>onBool('sellAtRetire', e.target.checked)} />
              <span style={{fontSize:13}}>Sell property and add equity when both spouses are retired</span>
            </label>
                        <div style={panel.hr} />

            <h4 style={{margin:'8px 0',fontWeight:600}}>Taxes (simplified)</h4>
            <Hint text="Use blended effective rates (Fed + state). 401k withdraw tax applies to withdrawals & RMDs. SS taxable % is simplified." />
            <Field label="Effective tax on 401k withdrawals" hint="Applies to 401k withdrawals and RMDs. Example: 0.22 = 22% effective.">
              <Num step={0.01} value={state.tax401kWithdraw} placeholder="0.22" onChange={v=>onNum('tax401kWithdraw',v)} />
            </Field>
            <Field label="Effective tax on ordinary income" hint="Applies to wages, taxable SS portion, annuities. Example: 0.20 = 20%.">
              <Num step={0.01} value={state.effOrdinaryTaxRate} placeholder="0.20" onChange={v=>onNum('effOrdinaryTaxRate',v)} />
            </Field>
            <Field label="SS taxable portion (0–1)" hint="Rough share of SS that’s taxable. 0.0–0.85 (we default to 0.50).">
              <Num step={0.05} value={state.ssTaxablePercent} placeholder="0.50" onChange={v=>onNum('ssTaxablePercent',v)} />
            </Field>
            <Field label="Annuity taxable portion (0–1)" hint="Often 1.0 if fully taxable; lower if exclusion ratio applies.">
              <Num step={0.05} value={state.annuityTaxablePercent} placeholder="1.00" onChange={v=>onNum('annuityTaxablePercent',v)} />
            </Field>
            <Field label="Brokerage cap-gains drag (annual return drag)" hint="Annual tax friction on brokerage gains. Example: 0.003 = 0.3%/yr.">
              <Num step={0.001} value={state.capGainsDragBrokerage} placeholder="0.003" onChange={v=>onNum('capGainsDragBrokerage',v)} />
            </Field>

            <div style={panel.hr} />

            <h4 style={{margin:'8px 0',fontWeight:600}}>Children & 529 (per child)</h4>
            <Hint text="Each child has their own 529. HS/College costs optional. K-12 payments may be limited by the per-child cap." />
            {state.children.map((c,idx)=> (
              <div key={idx} style={{border:'1px dashed #e5e7eb',borderRadius:10,padding:10,marginBottom:10}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <Field label="Name">
                    <input value={c.name} onChange={e=>updateChild(idx,{name:e.target.value})} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid #d1d5db'}} placeholder="Child name"/>
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
                  <span style={{fontSize:12,color:'#6b7280'}}>Tip: Leave HS/College at 0 if not applicable.</span>
                </div>
              </div>
            ))}
            <button style={{...panel.button,background:'#e0f2fe',borderColor:'#bae6fd'}} onClick={addChild}>+ Add child</button>
            <Field label="529 — K-12 per-child annual cap" hint="Max allowed from 529 toward K-12 per child, per year. Confirm your state’s rules.">
              <Num value={state.k12CapPerChild} placeholder="e.g. 10000" onChange={v=>onNum('k12CapPerChild',v)} />
            </Field>

            <div style={panel.hr} />

            <h4 style={{margin:'8px 0',fontWeight:600}}>Policies — Contributions & RMD</h4>
            <Hint text="When the first spouse retires, you can keep, cut, or stop contributions until both are retired. RMDs force 401k distributions at the set ages." />
            <Field label="Contribution policy when first spouse retires" hint="Controls how contributions change between first & second retirements.">
              <select value={state.contributionPolicy} onChange={e=>setState(s=>({...s, contributionPolicy:e.target.value}))} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid #d1d5db'}}>
                <option value="full_until_both">Keep full contributions until both retire</option>
                <option value="half_after_first">Cut contributions to 50% after first retires</option>
                <option value="stop_after_first">Stop contributions once first retires</option>
              </select>
            </Field>
            <label style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <span>Enable RMDs</span>
              <input type="checkbox" checked={!!state.rmdEnabled} onChange={e=>onBool('rmdEnabled', e.target.checked)} />
            </label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <Field label="Your RMD age" hint="Often 73+ under current rules. This is simplified.">
                <Num value={state.rmdAgeSelf} placeholder="e.g. 73" onChange={v=>onNum('rmdAgeSelf',v)} />
              </Field>
              <Field label="Spouse RMD age" hint="RMD start age for spouse.">
                <Num value={state.rmdAgeSpouse} placeholder="e.g. 73" onChange={v=>onNum('rmdAgeSpouse',v)} />
              </Field>
            </div>

            {/* Save/Load/Export */}
            <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
              <button style={panel.primary} onClick={save}>Save</button>
              <button style={panel.button} onClick={clear}>Clear save</button>
              <button style={{...panel.button,background:'#eef2ff',borderColor:'#c7d2fe'}} onClick={load}>Load sample</button>
              <button style={{...panel.button,background:'#e0f2fe',borderColor:'#bae6fd'}} onClick={()=>exportCSV(det)}>Export CSV</button>
              {savedAt && <span style={{fontSize:12,color:'#6b7280',alignSelf:'center'}}>Saved {savedAt}</span>}
            </div>

            {/* Zero buttons */}
            <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
              <button style={{...panel.button,background:'#fff7ed',borderColor:'#fdba74'}} onClick={zeroAllAccounts}>Zero accounts</button>
              <button style={{...panel.button,background:'#fef9c3',borderColor:'#fde68a'}} onClick={zeroAllContribs}>Zero contribs</button>
              <button style={{...panel.button,background:'#dcfce7',borderColor:'#86efac'}} onClick={zeroAllIncomeSpend}>Zero income/spend</button>
              <button style={{...panel.button,background:'#e0e7ff',borderColor:'#c7d2fe'}} onClick={zeroAllTaxes}>Zero taxes</button>
              <button style={{...panel.button,background:'#fee2e2',borderColor:'#fecaca'}} onClick={zeroAllRealEstate}>Zero real estate</button>
              <button style={{...panel.button,background:'#f3f4f6',borderColor:'#e5e7eb'}} onClick={zeroEverything}><strong>Zero EVERYTHING</strong></button>
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
            <h3 style={{margin:'0 0 8px',fontWeight:600}}>Probability of Success</h3>
            <div style={{background:'#e5e7eb',borderRadius:10,height:12,overflow:'hidden'}}>
              <div style={{background:'#10b981',width:`${successPct}%`,height:12}} />
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#6b7280',marginTop:4}}>
              <span>0%</span><span>{successPct}%</span><span>100%</span>
            </div>
          </div>

          {/* Household Cash Flow */}
<CashFlowChart det={det} ssTaxablePercent={state.ssTaxablePercent} />

          {/* Deterministic — Investable Balances */}
          <div style={panel.card}>
            <h3 style={{margin:'0 0 8px',fontWeight:600}}>Deterministic — Investable Balances</h3>
            <InvestableBalancesChart data={det} height={H(340)} />
            <div style={{fontSize:12,color:'#6b7280',marginTop:6,display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>
              <div>Final Investable Total: <strong>{currency(latest.totalLiquid||0)}</strong></div>
              <div>Brokerage: <strong>{currency(latest.balBroker||0)}</strong> · CDs: <strong>{currency(latest.balCDs||0)}</strong> · 401k: <strong>{currency(latest.bal401k||0)}</strong> · Roth: <strong>{currency(latest.balRoth||0)}</strong></div>
              <div>529 (total): <strong>{currency(latest.bal529Total||0)}</strong></div>
              <div>Property Value: <strong>{currency(latest.houseVal||0)}</strong> · Mortgage: <strong>{currency(latest.mortgage||0)}</strong></div>
            </div>
          </div>

          {/* Net Worth Projection */}
          <div style={panel.card}>
            <h3 style={{margin:'0 0 8px',fontWeight:600}}>Net Worth Projection</h3>
            <div style={{width:'100%', height: H(380)}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={det}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={currency} width={90} />
                  <Tooltip formatter={(v)=>currency(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="netWorth" name="Net Worth (Investables + 529 + Home Equity)" stroke="#2563eb" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Final Allocation Snapshot */}
          <div style={panel.card}>
            <h3 style={{margin:'0 0 8px',fontWeight:600,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>Final Allocation Snapshot (Last Year)</span>
              <span style={{fontSize:12,color:'#6b7280'}}>Investables mix only</span>
            </h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,fontSize:14}}>
              <div><strong>Taxable</strong><div>{currency(taxable)} ({pct(taxable)})<div style={panel.small}>Brokerage, CDs</div></div></div>
              <div><strong>Tax-Deferred</strong><div>{currency(deferred)} ({pct(deferred)})<div style={panel.small}>401k (RMDs)</div></div></div>
              <div><strong>Tax-Free</strong><div>{currency(taxfree)} ({pct(taxfree)})<div style={panel.small}>Roth IRA</div></div></div>
            </div>
          </div>

          {/* Data Snapshot */}
          <div style={panel.card}>
            <h3 style={{margin:'0 0 8px',fontWeight:600}}>Data Snapshot — Final & Custom Year</h3>

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

            <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:16}}>
              {/* Final Year */}
              <div>
                <h4 style={{margin:'6px 0'}}>Final Year</h4>
                <table style={panel.table}>
                  <tbody>
                    <tr><td style={panel.td}>Brokerage</td><td style={panel.td}>{currency((det[det.length-1]||{}).balBroker||0)}</td></tr>
                    <tr><td style={panel.td}>CDs</td><td style={panel.td}>{currency((det[det.length-1]||{}).balCDs||0)}</td></tr>
                    <tr><td style={panel.td}>401k (Both)</td><td style={panel.td}>{currency((det[det.length-1]||{}).bal401k||0)}</td></tr>
                    <tr><td style={panel.td}>Roth (Both)</td><td style={panel.td}>{currency((det[det.length-1]||{}).balRoth||0)}</td></tr>
                    <tr><td style={panel.td}><strong>Investables</strong></td><td style={panel.td}><strong>{currency((det[det.length-1]||{}).totalLiquid||0)}</strong></td></tr>
                    <tr><td style={panel.td}>529 Total</td><td style={panel.td}>{currency((det[det.length-1]||{}).bal529Total||0)}</td></tr>
                    <tr><td style={panel.td}>Home Equity</td><td style={panel.td}>{currency((det[det.length-1]||{}).houseEquity||0)}</td></tr>
                    <tr><td style={panel.td}><strong>Net Worth</strong></td><td style={panel.td}><strong>{currency((det[det.length-1]||{}).netWorth||0)}</strong></td></tr>
                  </tbody>
                </table>
              </div>

              {/* Custom Year */}
              <div>
                <h4 style={{margin:'6px 0'}}>Custom Year: {firstYear.year||'-'}</h4>
                <table style={panel.table}>
                  <tbody>
                    <tr><td style={panel.td}>Brokerage</td><td style={panel.td}>{currency(firstYear.balBroker||0)}</td></tr>
                    <tr><td style={panel.td}>CDs</td><td style={panel.td}>{currency(firstYear.balCDs||0)}</td></tr>
                    <tr><td style={panel.td}>401k (Both)</td><td style={panel.td}>{currency(firstYear.bal401k||0)}</td></tr>
                    <tr><td style={panel.td}>Roth (Both)</td><td style={panel.td}>{currency(firstYear.balRoth||0)}</td></tr>
                    <tr><td style={panel.td}><strong>Investables</strong></td><td style={panel.td}><strong>{currency(firstYear.totalLiquid||0)}</strong></td></tr>
                    <tr><td style={panel.td}>529 Total</td><td style={panel.td}>{currency(firstYear.bal529Total||0)}</td></tr>
                    <tr><td style={panel.td}>Home Equity</td><td style={panel.td}>{currency(firstYear.houseEquity||0)}</td></tr>
                    <tr><td style={panel.td}><strong>Net Worth</strong></td><td style={panel.td}><strong>{currency(firstYear.netWorth||0)}</strong></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
                    {/* Real Estate — Value vs Mortgage */}
          <div style={panel.card}>
            <h3 style={{margin:'0 0 8px',fontWeight:600}}>Real Estate — Value vs Mortgage</h3>
            <div style={{width:'100%',height:H(340)}}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={det}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={currency} width={90} />
                  <Tooltip formatter={(v)=>currency(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="houseVal" name="Property Value" stroke="#2563eb" dot={false} />
                  <Line type="monotone" dataKey="mortgage" name="Mortgage" stroke="#ef4444" dot={false} />
                  <Bar dataKey="equityRealized" name="Equity Realized" fill="#10b981" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Income vs Spending */}
          <div style={panel.card}>
            <h3 style={{margin:'0 0 8px',fontWeight:600}}>Income vs Spending</h3>
            <div style={{width:'100%',height:H(360)}}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={det}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={currency} width={90} />
                  <Tooltip formatter={(v)=>currency(v)} />
                  <Legend />
                  <Bar dataKey="totalSpending" name="Total Spending" fill="#ef4444" />
                  <Line type="monotone" dataKey="incomeStreams" name="Income (Wages + SS + Annuities + RE)" stroke="#2563eb" dot={false} />
                  <Line type="monotone" dataKey="wdTotal" name="From Portfolio (Withdrawals)" stroke="#10b981" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

<CashFlowChartDetailed det={det} />


          {/* Education — HS & College Funding */}
          <div style={panel.card}>
            <h3 style={{margin:'0 0 8px',fontWeight:600}}>Education — HS & College Funding</h3>
            <div style={{width:'100%',height:H(360)}}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={det}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={currency} width={90} />
                  <Tooltip formatter={(v)=>currency(v)} />
                  <Legend />
                  <Bar stackId="edu"  dataKey="hsPaidBy529"      name="HS from 529" fill="#3b82f6" />
                  <Bar stackId="edu"  dataKey="hsFromPortfolio"  name="HS from Portfolio" fill="#93c5fd" />
                  <Bar stackId="edu2" dataKey="collegePaidBy529" name="College from 529" fill="#f59e0b" />
                  <Bar stackId="edu2" dataKey="collegeFromPortfolio" name="College from Portfolio" fill="#fcd34d" />
                  <Line type="monotone" dataKey="hsTotal"      name="HS Cost" stroke="#2563eb" dot={false} />
                  <Line type="monotone" dataKey="collegeTotal" name="College Cost" stroke="#f59e0b" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Success Rate Over Time (Monte Carlo) */}
          <div style={panel.card}>
            <h3 style={{margin:'0 0 8px',fontWeight:600}}>Success Rate Over Time (Monte Carlo)</h3>
            <div style={{width:'100%',height:H(300)}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mc.survival}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v)=> (v*100).toFixed(0)+'%'} width={70} />
                  <Tooltip formatter={(v)=> (typeof v==='number'? (v*100).toFixed(0)+'%' : v)} />
                  <Legend />
                  <Line type="monotone" dataKey="aliveRate" name="Solvent %" stroke="#10b981" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

            {/* Effective Tax Rate & Total Taxes Over Time */}
<div style={panel.card}>
  <h3 style={{margin:'0 0 8px',fontWeight:600}}>
    Effective Tax Rate & Total Taxes Over Time — Avg: {avgEffPct}%
  </h3>
  <div style={{width:'100%',height:H(340)}}>
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={taxRateRows}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        {/* Left axis for percentage */}
        <YAxis
          yAxisId="left"
          tickFormatter={(v)=> (v*100).toFixed(0)+'%'}
          width={60}
        />
        {/* Right axis for dollars */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={currency}
          width={90}
        />
        <Tooltip
          formatter={(value, name) =>
            name === 'Effective Tax Rate'
              ? (typeof value==='number' ? (value*100).toFixed(1)+'%' : value)
              : currency(value)
          }
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="effRate"
          name="Effective Tax Rate"
          stroke="#2563eb"
          dot={false}
          strokeWidth={2}
        />
        <Bar
          yAxisId="right"
          dataKey="taxTotal"
          name="Total Taxes ($)"
          fill="#ef4444"
        />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
  
<div style={{marginTop:4,fontSize:12,color:'#6b7280'}}>
  Effective rate = income taxes ÷ (wages + taxable SS + taxable annuities + 401k withdrawals + RMDs).  
  (Brokerage drag excluded — already modeled in returns.)  
  Simplified view — not a filing calc.
</div>

</div>

          {/* Withdrawal Recommendation */}
          <div style={panel.card}>
            <h3 style={{margin:'0 0 8px',fontWeight:600}}>Withdrawal Recommendation (30 Years)</h3>
            <p style={panel.sub}>Covers spending after non-portfolio income (Wages/SS/Annuities/RE). Sequence: Taxable → CDs → 401k (grossed) → Roth.</p>

            <div style={{width:'100%',height:H(360),marginBottom:12}}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={withdrawRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={currency} width={90} />
                  <Tooltip formatter={(v) => currency(v)} />
                  <Legend />
                  <Bar stackId="w" dataKey="taxable"       name="Taxable" fill="#f59e0b" />
                  <Bar stackId="w" dataKey="cds"           name="CDs" fill="#10b981" />
                  <Bar stackId="w" dataKey="deferredNet"   name="401k (Net)" fill="#7c3aed" />
                  <Bar stackId="w" dataKey="taxFree"       name="Roth" fill="#ef4444" />
                  <Line type="monotone" dataKey="need"     name="Need After Non-Portfolio Income" stroke="#2563eb" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{overflow:'auto'}}>
              <table style={panel.table}>
                <thead>
                  <tr>
                    <th style={panel.th}>Year</th>
                    <th style={panel.th}>Need (After Non-Portfolio)</th>
                    <th style={panel.th}>Taxable</th>
                    <th style={panel.th}>CDs</th>
                    <th style={panel.th}>401k Gross</th>
                    <th style={panel.th}>401k Net</th>
                    <th style={panel.th}>Roth</th>
                    <th style={panel.th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawRows.slice(0,30).map((r)=>(
                    <tr key={r.year}>
                      <td style={panel.td}>{r.year}</td>
                      <td style={panel.td}>{currency(r.need)}</td>
                      <td style={panel.td}>{currency(r.taxable)}</td>
                      <td style={panel.td}>{currency(r.cds)}</td>
                      <td style={panel.td}>{currency(r.deferredGross)}</td>
                      <td style={panel.td}>{currency(r.deferredNet)}</td>
                      <td style={panel.td}>{currency(r.taxFree)}</td>
                      <td style={panel.td}>{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:6, fontSize:12, color:'#6b7280'}}>
              Note: effective ordinary tax rate should reflect Fed + state; this model uses your single blended rate for simplicity.
            </div>
          </div>

          {/* Tax worksheet */}
          <div style={panel.card}>
            <h3 style={{margin:'0 0 8px',fontWeight:600}}>Tax Worksheet — Latest Year (Simplified)</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,fontSize:14}}>
              <div>
                <div><strong>Ordinary income</strong></div>
                <div className="row">Wages: {currency(latest.wageSelf||0)} (you) · {currency(latest.wageSpouse||0)} (spouse)</div>
                <div className="row">SS income: {currency(latest.ssIncome||0)} · taxable ~{Math.round((state.ssTaxablePercent||0)*100)}%</div>
                <div className="row">Annuities: {currency(latest.annuityIncome||0)} · taxable ~{Math.round((state.annuityTaxablePercent||0)*100)}%</div>
                <div className="row">Tax on ordinary @ eff ~{Math.round((state.effOrdinaryTaxRate||0)*100)}%: <strong>{currency(latest.taxOtherIncome||0)}</strong></div>
              </div>
              <div>
                <div><strong>Tax-deferred distributions</strong></div>
                <div className="row">RMD Self: {currency(latest.rmdSelfGross||0)} · tax {currency(latest.rmdSelfTax||0)}</div>
                <div className="row">RMD Spouse: {currency(latest.rmdSpouseGross||0)} · tax {currency(latest.rmdSpouseTax||0)}</div>
                <div className="row">401k withdrawals tax: <strong>{currency(latest.tax401kTotal||0)}</strong></div>
              </div>
            </div>
            <div style={{marginTop:8,fontSize:14}}>
              <div>Brokerage drag (already taken out of returns): <strong>{currency(latest.taxBrokerageDrag||0)}</strong></div>
              <div>Total estimated taxes: <strong>{currency(latest.taxTotal||0)}</strong></div>
            </div>
          </div>

        </section>
      </div>
    </div>
  </div>
);
}
/* ------------ Small UI helpers (with inline hints) ------------ */
function Field({ label, children, hint }) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>{label}</div>
      {children}
      {hint ? (
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, lineHeight: 1.35 }}>{hint}</div>
      ) : null}
    </label>
  );
}

function Num({ value, onChange, step = 1, placeholder }) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 10px',
        fontSize: 14,
        borderRadius: 8,
        border: '1px solid #d1d5db',
      }}
    />
  );
}

function Hint({ text }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: '#6b7280',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '6px 8px',
        marginBottom: 8,
        lineHeight: 1.4,
      }}
    >
      {text}
    </div>
  );
}