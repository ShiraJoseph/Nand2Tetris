// Program in Hack assembly language that multiplies R0 and R1 and stores the result in R2.
// (R0, R1, R2 refer to RAM[0], RAM[1], and RAM[2], respectively.)


@R0
D=M
@x
M=D//x=R0

@R1
D=M
@y
M=D//y=R1

@prod
M=0//prod=0

(LOOP)
@y
D=M
@STOP
D;JEQ//if y=0 goto STOP

@prod
D=M
@x
D=D+M//Add x to the running total
@prod
M=D

@y
M=M-1//y--

@LOOP
0;JMP//repeat loop

(STOP)
@prod
D=M
@R2
M=D//put the product in R2

(END)
@END
0;JMP//ending loop
