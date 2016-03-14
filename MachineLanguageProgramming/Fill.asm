// Program in Hack assembly language that runs an infinite loop 
// that listens to the keyboard input. When a key is pressed (any key), 
// the program blackens the screen, i.e. writes "black" in every pixel. 
// When no key is pressed, the program clears the screen, i.e. writes 
// "white" in every pixel.

(LISTEN)

//set n to last screen pixel
@SCREEN
D=A
@8192
D=D+A
@n
M=D//n=SCREEN+8192

//set i to first screen pixel
@SCREEN
D=A
@i
M=D

@KBD //Keyboard register
D=M
@SCREENON
D;JNE//if any bit in KBD is not 0, turn the screen on

@SCREENOFF
0;JMP//otherwise, turn the screen off

@LISTEN
0;JMP//infinite listening loop

(SCREENON)
//if(i==n) go back to listening loop
@n
D=M
@i
D=D-M
@LISTEN
D;JEQ

@i
A=M
M=-1//RAM[SCREEN+i]=-1

@i
M=M+1//i++

@SCREENON
0;JMP

(SCREENOFF)
//if(i==n) go back to listening loop
@n
D=M
@i
D=D-M
@LISTEN
D;JEQ

@i
A=M
M=0//RAM[SCREEN+i]=0

@i
M=M+1//i++

@SCREENOFF
0;JMP
