import * as React from "react";
import type { StepperProps } from "./types";

interface StepperContextValue extends StepperProps {
    clickable?: boolean;
    isError?: boolean;
    isLoading?: boolean;
    isVertical?: boolean;
    stepCount?: number;
    expandVerticalSteps?: boolean;
    activeStep: number;
    initialStep: number;
}

type StepperContextProviderProps = {
    value: Omit<StepperContextValue, "activeStep">;
    children: React.ReactNode;
};

export type StepperProviderRef = {
    nextStep: () => void;
    prevStep: () => void;
    resetSteps: () => void;
    setStep: (step: number) => void;
};

const StepperContext = React.createContext<
    StepperContextValue & StepperProviderRef
>({
    steps: [],
    activeStep: 0,
    initialStep: 0,
    nextStep: () => {},
    prevStep: () => {},
    resetSteps: () => {},
    setStep: () => {},
});

const StepperProvider = React.forwardRef(function SP(
    { value, children }: StepperContextProviderProps,
    ref: React.Ref<any>
) {
    const isError = value.state === "error";
    const isLoading = value.state === "loading";

    const [activeStep, setActiveStep] = React.useState(value.initialStep);

    const nextStep = () => {
        
        setActiveStep((prev) => prev + 1);
    };

    const prevStep = () => {
        
        setActiveStep((prev) => prev - 1);
    };

    const resetSteps = () => {
        
        setActiveStep(value.initialStep);
    };

    const setStep = (step: number) => {
        
        setActiveStep(step);
    };

    React.useImperativeHandle(ref, () => ({
        nextStep,
        prevStep,
        resetSteps,
        setStep,
        getActiveStep: () => activeStep,
    }));

    return (
        <StepperContext.Provider
            value={{
                ...value,
                isError,
                isLoading,
                activeStep,
                nextStep,
                prevStep,
                resetSteps,
                setStep,
            }}
        >
            {children}
        </StepperContext.Provider>
    );
});

export { StepperContext, StepperProvider };
