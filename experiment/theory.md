🧭 1. Introduction

The Ferranti Effect is a phenomenon in power transmission where the voltage at the receiving end of a long transmission line is higher than the sending end voltage, particularly under no-load or light-load condition

📌 Where It Occurs:

*Long transmission lines (typically >150 km


*Light or no load at the receiving end


*High voltage AC systems (50Hz or 60Hz) 


2. Why Does the Ferranti Effect Occur?


✅ Main Cause:

The transmission line behaves like a capacitor, especially under light-load or no-load conditions.


Even if there's no load, the line has a shunt capacitance to ground that causes charging current to flow.


This charging current is leading in nature and flows back toward the source.


Due to the inductive reactance of the line, the voltage drop caused by this current is negative (leads to a rise instead of a drop).


The result is an increase in receiving end voltage.




3.🔍 What Causes the Ferranti Effect?


The Ferranti Effect occurs due to the line capacitance and inductive reactance of transmission lines.


*Capacitive charging current flows along the line even when the load is absent.


*This current leads to a leading voltage drop across the line inductance.


*The voltage adds up toward the receiving end due to this reactive effect.


This leading charging current and the lagging line inductance create a situation where :-Vs<Vr

where
       Vr = Receving end voltage
       
       Vs= send end voltage

 Physical Model of the Line

Physical Model of the Line
A long transmission line can be modeled using the π-equivalent circuit, which includes:

Series inductance L


Shunt capacitance C

NEglegible resistance R=0 under ideal condition 



Sending End                Transmission Line                Receiving End
   o ──────/\/\/\/─────┬────/\/\/\/─────┬──── o
           jXL        === C/2       === C/2
                       GND           GND


4.🧮 Mathematical Derivation of Ferranti Effect

Let:​
Vs  = Sending end voltage


​Vr= Receiving end voltage


L = Total line inductance


C = Total line capacitance


ω=2πf = Angular frequency (rad/s


Under no-load condition, the receiving-end voltage becomes:

Vr ≈ Vs × (1 + (ω² × L × C) / 2)


Or equivalently, the percentage voltage rise is:


(Vr-Vs) / Vs=(ω² × L × C) / 2


This formula shows that Vr > Vs when the line has significant inductance and capacitance under light or no load.

🔹 Charging Current (No Load)
Under no load:

I_C = jωC × V_R
This charging current flows through the line inductance L

L, producing a voltage rise at the receiving end.

🔹 Voltage Rise (Due to Inductance)
Voltage drop across inductance:

ΔV = jωL × I_C
   substitute Ic= Jwc *Vr
ΔV = jωL × jωC × V_R
ΔV = -ω² × L × C × V_R
Therefore, the sending end voltage is:
V_S = V_R + ΔV
V_S = V_R - ω² × L × C × V_R
Thus:
V_R = V_S / (1 - ω²LC)


5.🛠️ How to Minimize Ferranti Effect


*Connect reactive loads (inductive) at the receiving end.


*Use shunt reactors to absorb excess reactive power.


*Reduce line charging current using series capacitors (not common).


*Load the line—the effect is negligible under full load conditions.

🔍 6. When Is the Ferranti Effect Significant?

Line length > 150 km

High voltage transmission (≥ 132 kV)

Low or no load at receiving end

Higher system frequency (ω = 2πf)

It is more pronounced in underground cables due to higher capacitance per unit length.


6.📈Effect Observation

*Voltage rises gradually along the line from sending to receiving end.

*More pronounced in underground cables due to high capacitance.

*Increased overvoltage stress at the receiving end.

7.📌 Key Observations

*The longer the line, the greater the Ferranti Effect.


*The higher the line voltage and frequency, the stronger the effect.


*It's more serious in underground cables (higher C) than in overhead lines.



✅ Solutions:
Use shunt reactors at receiving end to absorb excess reactive power.

Load the line appropriately to reduce effect.

Capacitive compensation devices (inversely tuned to reduce net capacitance).



8.✅ Conclusion

The Ferranti Effect is a vital consideration in high-voltage long-distance AC power transmission, especially during light-load or no-load operation. It arises due to the interplay between the line capacitance and inductance, causing the receiving end voltage to exceed the sending end voltage.


*This overvoltage can cause:

*Stress on insulation

*Equipment failure

*Malfunction of protection systems



