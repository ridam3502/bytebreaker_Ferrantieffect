Procedure
Open the Simulation: Launch the virtual simulator for the Ferranti Effect experiment.

Select Line Length: Choose the length of the transmission line (e.g., 200 km, 300 km, 400 km).
 : Define System Parameters
Choose realistic high-voltage transmission line parameters.

Example values:

Line length (l) = 200 km
Frequency (f) = 50 Hz
Inductance (L) = 1 mH/km → Total L = 0.2 H
Capacitance (C) = 0.01 µF/km → Total C = 2 µF
Source Voltage = 230 kV (RMS line-to-line)

: Leave Receiving End Open
Do not connect any load at the receiving end. This creates the no-load condition necessary to observe the Ferranti Effect.

: Input the desired sending end voltage.

Set Line Parameters: Adjust the per-unit length series resistance (R), series inductance (L), and shunt capacitance (C) of the transmission line.

Set Load Conditions:

 : Set Simulation Time and Solver
 
Simulation time: 1–2 seconds

Use discrete solver or ODE23tb (stiff) for better accuracy

Time step: 1e-5 or smalle
For observing Ferranti Effect, set the load to "No Load" or "Light Load".

Optionally, vary the load to see its impact on the receiving end voltage.

Run Simulation: Start the simulation to observe the sending and receiving end voltages.

Observe Output: The simulator displays:

 Record the Results
 
Use the scope or data output to compare:

Sending End Voltage (V_S)

Receiving End Voltage (V_R)

The sending end voltage (Vs)
​


The receiving end voltage (Vr)

A phasor diagram illustrating the voltage and current relationships.

Optionally, the charging current and reactive power.

Calculate Voltage Rise Percentage:
% Voltage Rise = ((V_R - V_S) / V_S) × 100

Change line length to see its effect.

Vary shunt capacitance or series inductance to understand their impact.

Introduce a shunt reactor (if simulated) and observe its effect on V 
R
​
 .

Analyze Results: Note how the Ferranti Effect changes with varying line parameters and load conditions, and how mitigation techniques affect the receiving end voltage.
